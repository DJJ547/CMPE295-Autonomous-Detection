import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { useAuth } from "../contexts/auth";
import {
  Modal,
  Tab,
  Card,
  Checkbox,
  Button,
  Label,
  Icon,
  Dropdown,
  Input,
  Pagination,
  Loader,
} from "semantic-ui-react";

// ✂️ Remove defaultProps warning on Tab.Pane
delete Tab.Pane.defaultProps;

const API_BASE = process.env.REACT_APP_LOCALHOST; // e.g. "http://127.0.0.1:8000/"

const getColor = (status) => {
  switch (status) {
    case "created":
      return "grey";
    case "assigned":
      return "blue";
    case "in_progress":
      return "yellow";
    case "completed":
      return "green";
    default:
      return "teal";
  }
};

export default function TaskAssigningPage() {
  const { user } = useAuth();
  const isStaff = user?.role === "admin";

  const statusTabs = isStaff
    ? ["all", "unverified", "verified", "assigned", "completed", "discarded"]
    : ["assigned", "in_progress", "completed"];

  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState(statusTabs[0]);
  const [tasks, setTasks] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [users, setUsers] = useState([]);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    if (!user) return;

    fetchTasks();
    if (isStaff) fetchWorkers();
  }, [selectedTab, user]);

  async function fetchTasks() {
    setLoading(true);
    try {
      const url = isStaff
        ? `${API_BASE}api/tasks`
        : `${API_BASE}api/getAssignedTasks`;
      const resp = await axios.get(url, { params: { user_id: user.id } });
      const data = resp.data.tasks || resp.data;
      setTasks(
        data.map((e) => ({
          id: e.task_id,
          image: e.image_url,
          metadata: Array.isArray(e.metadata) ? e.metadata : [],
          title: e.label,
          progress_status: e.progress_status,
          verification_status: e.verification_status,
          assignedTo: e.worker_name ?? "Unassigned",
          location: e.street || "",
          timestamp: e.created_at,
          confidence: e.confidence,
          ...e,
        }))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchWorkers() {
    try {
      const resp = await axios.get(`${API_BASE}api/tasks/getWorkers`);
      setUsers(
        resp.data.map((u) => ({
          key: u.id,
          value: u.id,
          text: `${u.firstName} ${u.lastName}`,
        }))
      );
    } catch (err) {
      console.error(err);
    }
  }

  async function updateTasks(updates) {
    await axios.put(`${API_BASE}api/tasks/bulk`, updates);
  }
  async function startTasks(ids) {
    await axios.post(`${API_BASE}api/startTasks`, {
      user_id: user.id,
      task_ids: ids,
    });
  }
  async function completeTasks(ids) {
    await axios.post(`${API_BASE}api/completeTasks`, {
      user_id: user.id,
      task_ids: ids,
    });
  }

  // --- handlers ---
  const handleSelect = (id) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const handleVerify = async (id = null) => {
    const ids = id ? [id] : selectedIds;
    await updateTasks(
      ids.map((i) => ({ task_id: i, verification_status: "verified" }))
    );
    fetchTasks();
  };

  const handleStartSelected = async () => {
    if (!selectedIds.length) return;
    await startTasks(selectedIds);
    fetchTasks();
  };

  const handleDone = async (id = null) => {
    const ids = id ? [id] : selectedIds;
    if (isStaff) {
      await updateTasks(
        ids.map((i) => ({ task_id: i, progress_status: "completed" }))
      );
    } else {
      await completeTasks(ids);
    }
    fetchTasks();
  };

  const handleDiscard = async (id = null) => {
    if (selectedIds.length === 0 && id == null) {
      return;
    }
    const updateIds = id ? [id] : selectedIds;

    const update = updateIds.map((id) => ({
      task_id: id,
      verification_status: "discarded",
    }));

    await updateTasks(update);
    fetchTasks();
  };

  const handleAssign = async (id = null) => {
    const ids = id ? [id] : selectedIds;
    await updateTasks(
      ids.map((i) => ({
        task_id: i,
        progress_status: "assigned",
        worker_id: selectedWorkerId,
      }))
    );
    fetchTasks();
  };

  const markAsStarted = async (id) => {
    await startTasks([id]);
    fetchTasks();
  };

  // --- filter + sort + search by title *and* location ---
  const filteredTasks = () => {
    const q = searchQuery.trim().toLowerCase();
    return tasks
      .filter((t) => {
        const okStatus =
          selectedTab === "all" ||
          t.progress_status === selectedTab ||
          t.verification_status === selectedTab;
        const okSearch =
          t.title.toLowerCase().includes(q) ||
          t.location.toLowerCase().includes(q);
        return okStatus && okSearch;
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  // --- individual card ---
  const TaskCard = ({ task, selected }) => {
    const imgRef = useRef();
    const [dims, setDims] = useState({ width: 1, height: 1 });

    useEffect(() => {
      if (!imgRef.current) return;
      const obs = new ResizeObserver((entries) => {
        for (let e of entries) {
          setDims({ width: e.contentRect.width, height: e.contentRect.height });
        }
      });
      obs.observe(imgRef.current);
      return () => obs.disconnect();
    }, []);

    const renderBox = () => {
      const meta = task.metadata;
      if (!meta) return null;

      const scaleX = dims.width / 640;
      const scaleY = dims.height / 640;
      const x1 = meta.X1_loc * scaleX;
      const y1 = meta.Y1_loc * scaleY;
      const x2 = meta.X2_loc * scaleX;
      const y2 = meta.Y2_loc * scaleY;

      return (
        <div
          key={meta.id}
          style={{
            position: "absolute",
            left: x1,
            top: y1,
            width: x2 - x1,
            height: y2 - y1,
            border: "2px solid red",
            backgroundColor: "rgba(255,0,0,0.2)",
            zIndex: 5,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -14,
              left: 0,
              color: "red",
              fontSize: 10,
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            {meta.label} ({meta.score.toFixed(3)})
          </div>
        </div>
      );
    };

    return (
      <Card fluid>
        <Checkbox
          checked={selected}
          onChange={() => handleSelect(task.id)}
          style={{ position: "absolute", top: 10, left: 10, zIndex: 10 }}
        />

        <div style={{ position: "relative", width: "100%" }}>
          <img
            ref={imgRef}
            src={task.image}
            alt=""
            style={{ width: "100%", height: "auto", display: "block" }}
          />
          {renderBox()}
        </div>
        <Card.Content>
          <Card.Header>{task.title}</Card.Header>
          <Card.Meta>{task.location}</Card.Meta>
          <Card.Description>
            <Label color={getColor(task.progress_status)}>
              {task.progress_status}
            </Label>
          </Card.Description>
        </Card.Content>
        <Card.Content extra>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem",
              marginTop: "0.5rem",
              justifyContent: "flex-start",
            }}
          >
            {isStaff ? (
              <>
                <Button
                  basic
                  color="orange"
                  onClick={() => handleVerify(task.id)}
                  style={{
                    width: "7rem",
                    height: "2.5rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                  }}
                >
                  🖊 Verify
                </Button>
                <Button
                  basic
                  color="blue"
                  onClick={() => {
                    setSelectedIds([task.id]);
                    setAssignModalOpen(true);
                  }}
                  style={{
                    width: "7rem",
                    height: "2.5rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                  }}
                >
                  👤 Assign
                </Button>
                <Button
                  basic
                  color="green"
                  onClick={() => handleDone(task.id)}
                  style={{
                    width: "7rem",
                    height: "2.5rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                  }}
                >
                  ✅ Complete
                </Button>
                <Button
                  basic
                  color="red"
                  onClick={() => handleDiscard(task.id)}
                  style={{
                    width: "7rem",
                    height: "2.5rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                  }}
                >
                  🗑 Discard
                </Button>
              </>
            ) : (
              <>
                {task.progress_status === "assigned" && (
                  <Button
                    basic
                    color="orange"
                    onClick={() => markAsStarted(task.id)}
                    style={{
                      width: "7rem",
                      height: "2.5rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                    }}
                  >
                    ▶️ Start
                  </Button>
                )}
                {task.progress_status === "in_progress" && (
                  <Button
                    basic
                    color="green"
                    onClick={() => handleDone(task.id)}
                    style={{
                      width: "7rem",
                      height: "2.5rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                    }}
                  >
                    ✅ Complete
                  </Button>
                )}
              </>
            )}
          </div>
        </Card.Content>
      </Card>
    );
  };

  // --- build tab panes ---
  const panes = statusTabs.map((status) => {
    const list = filteredTasks().filter(
      (t) =>
        status === "all" ||
        t.progress_status === status ||
        t.verification_status === status
    );
    const totalPages = Math.ceil(list.length / itemsPerPage);
    const slice = list.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );

    return {
      menuItem: status.charAt(0).toUpperCase() + status.slice(1),
      render: () => (
        <Tab.Pane>
          {/* Search by title OR location */}
          <Input
            icon={
              searchQuery
                ? {
                    name: "close",
                    link: true,
                    onClick: () => setSearchQuery(""),
                  }
                : "search"
            }
            placeholder="Search by title or location..."
            value={searchQuery}
            onChange={(_, { value }) => {
              setSearchQuery(value);
              setCurrentPage(1);
            }}
            style={{ marginBottom: 20, width: "100%" }}
          />

          {/* Bulk actions for staff */}
          {(isStaff ||
            selectedTab === "in_progress" ||
            selectedTab === "assigned") && (
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: 20 }}>
              <Label>
                <strong>{selectedIds.length}</strong> selected
              </Label>

              {isStaff && (
                <>
                  <Button
                    color="orange"
                    disabled={!selectedIds.length}
                    onClick={() => handleVerify()}
                  >
                    🖊 Verify Selected
                  </Button>
                  <Button
                    color="blue"
                    disabled={!selectedIds.length}
                    onClick={() => setAssignModalOpen(true)}
                  >
                    👤 Assign Selected
                  </Button>
                </>
              )}

              {!isStaff && (
                <Button
                  color="yellow"
                  disabled={!selectedIds.length}
                  onClick={() => handleStartSelected()}
                >
                  ▶️ Start Selected
                </Button>
              )}
              <Button
                color="grey"
                disabled={!selectedIds.length}
                onClick={() => handleDone()}
              >
                ✅ Complete Selected
              </Button>
            </div>
          )}

          {/* Cards grid */}
          {loading ? (
            <Loader active inline="centered" size="large" />
          ) : (
            <div className="ui three stackable cards">
              {slice.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  selected={selectedIds.includes(task.id)}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ textAlign: "center", marginTop: 20 }}>
              <Pagination
                totalPages={totalPages}
                activePage={currentPage}
                onPageChange={(_, data) => setCurrentPage(data.activePage)}
              />
            </div>
          )}
        </Tab.Pane>
      ),
    };
  });

  // --- Assign modal ---
  const AssignModal = (
    <Modal
      open={assignModalOpen}
      onClose={() => setAssignModalOpen(false)}
      size="small"
    >
      <Modal.Header>Assign Tasks</Modal.Header>
      <Modal.Content>
        <Dropdown
          placeholder="Select Worker"
          fluid
          selection
          options={users}
          value={selectedWorkerId}
          onChange={(_, { value }) => setSelectedWorkerId(value)}
        />
      </Modal.Content>
      <Modal.Actions>
        <Button onClick={() => setAssignModalOpen(false)}>Cancel</Button>
        <Button
          primary
          disabled={!selectedWorkerId}
          onClick={async () => {
            await handleAssign();
            setAssignModalOpen(false);
            setSelectedWorkerId(null);
            fetchTasks();
          }}
        >
          Assign Selected
        </Button>
      </Modal.Actions>
    </Modal>
  );

  return (
    <div style={{ padding: 20 }}>
      <h2>
        <Icon name="tasks" /> Tasks
      </h2>
      <Tab
        panes={panes}
        onTabChange={(_, data) => {
          setSelectedTab(statusTabs[data.activeIndex]);
          setCurrentPage(1);
        }}
      />
      {isStaff && AssignModal}
    </div>
  );
}
