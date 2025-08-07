import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { useAuth } from "../contexts/auth";
import PopupWindow from "../components/PopupWindow";
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
    case "unverified":
      return "grey";
    case "verified":
      return "blue";
    case "assigned":
      return "purple";
    case "in_progress":
      return "yellow";
    case "completed":
      return "green";
    default:
      return "teal";
  }
};

export default function TaskAssigningPage() {
  const [selectedTaskForPopup, setSelectedTaskForPopup] = useState(null);

  const { user } = useAuth();
  const isStaff = user?.role === "admin";

  const statusTabs = isStaff
    ? ["unverified", "verified", "assigned", "in_progress", "completed", "discarded"]
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

  // NEW: Label edit modal states
  const [editLabelModalOpen, setEditLabelModalOpen] = useState(false);
  const [labelInput, setLabelInput] = useState("");
  const [selectedTaskForLabel, setSelectedTaskForLabel] = useState(null);

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
          metadata: e.metadata || {},
          title: e.label,
          status: e.status,
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

  // 🆕 NEW: Update label API call
  async function handleLabelUpdate(taskId, newLabel) {
    try {
      await axios.put(`${API_BASE}api/tasks/${taskId}/label`, { label: newLabel });
      fetchTasks();
    } catch (err) {
      console.error("Error updating label:", err);
    }
  }

  // --- handlers ---
  const handleSelect = (id) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const handleVerify = async (id = null) => {
    const ids = id ? [id] : selectedIds;
    await updateTasks(
      ids.map((i) => ({ task_id: i, status: "verified" }))
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
        ids.map((i) => ({ task_id: i, status: "completed" }))
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
      status: "discarded",
    }));

    await updateTasks(update);
    fetchTasks();
  };

  const handleAssign = async (id = null) => {
    const ids = id ? [id] : selectedIds;
    await updateTasks(
      ids.map((i) => ({
        task_id: i,
        status: "assigned",
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
        // 🆕 if discarded, only show under discarded tab
        if (t.status === "discarded" && selectedTab !== "discarded") {
          return false;
        }

        const okStatus =
          selectedTab === "all" ||
          t.status === selectedTab;

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
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(task.title);
    useEffect(() => {
      setEditValue(task.title);
    }, [task.title]);

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
      const scaleY = dims.height / 620;
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
            {meta.label} ({meta.score?.toFixed(3)})
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
            style={{ width: "100%", height: "auto", display: "block", cursor: "pointer" }}
            onClick={() =>
              setSelectedTaskForPopup(task)
            }
          />

          {renderBox()}
        </div>
        <Card.Content>
          <Card.Header style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {isEditing ? (
              <Input
                value={editValue}
                size="small"
                autoFocus
                onChange={(e, { value }) => setEditValue(value)}
                onKeyDown={async (e) => {
                  if (e.key === "Enter") {
                    await handleLabelUpdate(task.id, editValue);
                    setIsEditing(false);
                  } else if (e.key === "Escape") {
                    setEditValue(task.title);
                    setIsEditing(false);
                  }
                }}
                style={{ flex: 1, marginRight: 8 }}
              />
            ) : (
              <span>{task.title}</span>
            )}

            {/* ▶️ Edit / Save & Cancel buttons */}
            {isStaff && (
              isEditing ? (
                <span>
                  <Icon
                    name="check"
                    link
                    onClick={async () => {
                      await handleLabelUpdate(task.id, editValue);
                      setIsEditing(false);
                    }}
                  />
                  <Icon
                    name="close"
                    link
                    onClick={() => {
                      setEditValue(task.title);
                      setIsEditing(false);
                    }}
                  />
                </span>
              ) : (
                <Icon
                  name="pencil"
                  link
                  onClick={() => setIsEditing(true)}
                />
              )
            )}
          </Card.Header>
          <Card.Meta>{task.location}</Card.Meta>
          <Card.Description>
            <Label color={getColor(task.status)}>
              {task.status}
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
                {task.status !== "discarded" && task.status === "unverified" && (
                  <><Button
                    color="orange"
                    onClick={() => handleVerify(task.id)}
                  >
                    🖊 Verify
                  </Button>
                    <Button
                      color="red"
                      onClick={() => handleDiscard(task.id)}
                    >
                      🗑 Discard
                    </Button></>
                )}
                {task.status !== "discarded" && task.status === "verified" && (
                  <>
                    <Button
                      color="blue"
                      onClick={() => {
                        setSelectedIds([task.id]);
                        setAssignModalOpen(true);
                      }}
                    >
                      👤 Assign
                    </Button>
                    <Button
                      color="red"
                      onClick={() => handleDiscard(task.id)}
                    >
                      🗑 Discard
                    </Button>
                  </>
                )}
              </>
            ) : (
              <>
                {task.status === "assigned" && (
                  <Button
                    color="orange"
                    onClick={() => markAsStarted(task.id)}
                  >
                    ▶️ Start
                  </Button>
                )}
                {task.status === "in_progress" && (
                  <Button
                    color="green"
                    onClick={() => handleDone(task.id)}
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
        t.status === status ||
        t.status === status
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
          {selectedIds.length > 0 && (
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: 20 }}>
              <Label>
                <strong>{selectedIds.length}</strong> selected
              </Label>

              {isStaff && selectedTab === "unverified" && (
                <Button color="orange" onClick={() => handleVerify()}>
                  🖊 Verify Selected
                </Button>
              )}

              {isStaff && selectedTab === "verified" && (
                <Button color="blue" onClick={() => setAssignModalOpen(true)}>
                  👤 Assign Selected
                </Button>
              )}

              {isStaff && (
                <Button color="red" onClick={() => handleDiscard()}>
                  🗑 Discard Selected
                </Button>
              )}

              {!isStaff && selectedTab === "assigned" && (
                <Button color="yellow" onClick={handleStartSelected}>
                  ▶️ Start Selected
                </Button>
              )}

              {!isStaff && selectedTab === "in_progress" && (
                <Button color="green" onClick={() => handleDone()}>
                  ✅ Complete Selected
                </Button>
              )}
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

  // --- Edit Label Modal ---
  const EditLabelModal = (
    <Modal
      open={editLabelModalOpen}
      onClose={() => setEditLabelModalOpen(false)}
      size="small"
    >
      <Modal.Header>Edit Task Label</Modal.Header>
      <Modal.Content>
        <Input
          fluid
          placeholder="Enter new label"
          value={labelInput}
          onChange={(e) => setLabelInput(e.target.value)}
        />
      </Modal.Content>
      <Modal.Actions>
        <Button onClick={() => setEditLabelModalOpen(false)}>Cancel</Button>
        <Button
          primary
          disabled={!labelInput.trim()}
          onClick={async () => {
            await handleLabelUpdate(selectedTaskForLabel.id, labelInput);
            setEditLabelModalOpen(false);
            setLabelInput("");
            setSelectedTaskForLabel(null);
          }}
        >
          Save
        </Button>
      </Modal.Actions>
    </Modal>
  );

  return (
    <div style={{ padding: 20 }}>
      <Tab
        panes={panes}
        onTabChange={(_, data) => {
          setSelectedTab(statusTabs[data.activeIndex]);
          setCurrentPage(1);
        }}
      />
      {isStaff && AssignModal}
      {isStaff && EditLabelModal}

      {/* ✅ Add this block here: */}
      {selectedTaskForPopup && (
        <PopupWindow
          marker={selectedTaskForPopup}
          onClose={() => setSelectedTaskForPopup(null)}
          onVerify={handleVerify}
          onAssign={() => {
            setSelectedIds([selectedTaskForPopup.id]);
            setAssignModalOpen(true);
            setSelectedTaskForPopup(null);
          }}
          onDiscard={handleDiscard}
          onStart={() => markAsStarted(selectedTaskForPopup.id)}
          onComplete={() => handleDone(selectedTaskForPopup.id)}
          isStaff={isStaff}
          isDash={false}
        />
      )}
    </div>
  );

}
