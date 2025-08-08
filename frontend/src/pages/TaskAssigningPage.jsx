import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
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

// Remove defaultProps warning on Tab.Pane
delete Tab.Pane.defaultProps;

const API_BASE = process.env.REACT_APP_LOCALHOST;

const getColor = (status) => {
  switch (status) {
    case "unverified": return "grey";
    case "verified": return "blue";
    case "assigned": return "purple";
    case "in_progress": return "yellow";
    case "completed": return "green";
    default: return "teal";
  }
};

export default function TaskAssigningPage() {
  const { user } = useAuth();
  const isStaff = user?.role === "admin";
  const statusTabs = isStaff
    ? ["unverified", "verified", "assigned", "in_progress", "completed", "discarded"]
    : ["assigned", "in_progress", "completed"];

  // UI state
  const [tasks, setTasks] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [selectedTab, setSelectedTab] = useState(statusTabs[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState(null);
  const [users, setUsers] = useState([]);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedTaskForPopup, setSelectedTaskForPopup] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch tasks + workers on tab / page change
  useEffect(() => {
    if (!user) return;
    fetchTasks();
    if (isStaff) fetchWorkers();
  }, [user, selectedTab, currentPage]);

  async function fetchTasks() {
    setLoading(true);
    try {
      const url = isStaff
        ? `${API_BASE}api/tasks`
        : `${API_BASE}api/getAssignedTasks`;
      const params = {
        user_id: user.id,
        status: selectedTab,
        page: currentPage,
        per_page: itemsPerPage,
      };
      const resp = await axios.get(url, { params });
      const data = resp.data.tasks || [];
      setTasks(
        data.map((e) => ({
          id: e.task_id,
          image: e.image_url,
          metadata: e.metadata || {},
          title: e.label,
          status: e.status,
          location: e.street || "",
          timestamp: e.created_at,
          ...e,
        }))
      );
      setTotalPages(resp.data.pagination?.total_pages || 1);
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

  // Bulk update helper
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
  async function handleLabelUpdate(taskId, newLabel) {
    await axios.put(`${API_BASE}api/tasks/${taskId}/label`, { label: newLabel });
    fetchTasks();
  }

  // Action handlers
  const handleSelect = (id) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const handleVerify = async (id = null) => {
    const ids = id ? [id] : selectedIds;
    await updateTasks(ids.map((i) => ({ task_id: i, status: "verified" })));
    fetchTasks();
  };

  const handleDiscard = async (id = null) => {
    const ids = id ? [id] : selectedIds;
    await updateTasks(ids.map((i) => ({ task_id: i, status: "discarded" })));
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

  const handleBulkStart = async () => {
    await startTasks(selectedIds);
    setSelectedIds([]);    // clear selection
    fetchTasks();
  };
  const handleBulkComplete = async () => {
    await handleDone();    // no id => uses selectedIds
    setSelectedIds([]);    // clear selection
  };

  const handleDone = async (id = null) => {
    const ids = id ? [id] : selectedIds;
    if (isStaff) {
      await updateTasks(ids.map((i) => ({ task_id: i, status: "completed" })));
    } else {
      await completeTasks(ids);
    }
    fetchTasks();
  };

  const markAsStarted = async (id) => {
    await startTasks([id]);
    fetchTasks();
  };

  // Search filter
  const filteredTasks = tasks.filter((t) =>
    // 1) only keep tasks whose status matches the current tab
    t.status === selectedTab &&
    // 2) then apply your title/location search
    (t.title.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
      t.location.toLowerCase().includes(searchQuery.trim().toLowerCase()))
  );

  // Single task card
  const TaskCard = ({ task, selected }) => {
    const imgRef = useRef();
    const [dims, setDims] = useState({ width: 1, height: 1 });
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(task.title);

    useEffect(() => { setEditValue(task.title); }, [task.title]);
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
      const m = task.metadata;
      if (!m) return null;
      const scaleX = dims.width / 640;
      const scaleY = dims.height / 640;
      const x1 = m.X1_loc * scaleX, y1 = m.Y1_loc * scaleY;
      const w = (m.X2_loc - m.X1_loc) * scaleX;
      const h = (m.Y2_loc - m.Y1_loc) * scaleY;
      return (
        <div
          key={m.id}
          style={{
            position: "absolute", left: x1, top: y1,
            width: w, height: h,
            border: "2px solid red", backgroundColor: "rgba(255,0,0,0.2)",
            zIndex: 5,
          }}
        >
          <div style={{
            position: "absolute", top: -14, left: 0,
            color: "red", fontSize: 10, fontWeight: 500, whiteSpace: "nowrap",
          }}>
            {m.label} ({m.score?.toFixed(3)})
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
            style={{ width: "100%", cursor: "pointer" }}
            onClick={() => setSelectedTaskForPopup(task)}
          />
          {renderBox()}
        </div>
        <Card.Content>
          <Card.Header style={{ display: "flex", justifyContent: "space-between" }}>
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
                  }
                  if (e.key === "Escape") {
                    setEditValue(task.title);
                    setIsEditing(false);
                  }
                }}
              />
            ) : (
              <span>{task.title}</span>
            )}
            {isStaff && (
              isEditing ? (
                <>
                  <Icon name="check" link onClick={async () => {
                    await handleLabelUpdate(task.id, editValue);
                    setIsEditing(false);
                  }} />
                  <Icon name="close" link onClick={() => {
                    setEditValue(task.title);
                    setIsEditing(false);
                  }} />
                </>
              ) : (
                <Icon name="pencil" link onClick={() => setIsEditing(true)} />
              )
            )}
          </Card.Header>
          <Card.Meta>{task.location}</Card.Meta>
          <Card.Description>
            <Label color={getColor(task.status)}>{task.status}</Label>
          </Card.Description>
        </Card.Content>
        <Card.Content extra>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {isStaff ? (
              <>
                {task.status === "unverified" && (
                  <>
                    <Button color="orange" onClick={() => handleVerify(task.id)}>
                      🖊 Verify
                    </Button>
                    <Button color="red" onClick={() => handleDiscard(task.id)}>
                      🗑 Discard
                    </Button>
                  </>
                )}
                {task.status === "verified" && (
                  <>
                    <Button color="blue" onClick={() => {
                      setSelectedIds([task.id]);
                      setAssignModalOpen(true);
                    }}>
                      👤 Assign
                    </Button>
                    <Button color="red" onClick={() => handleDiscard(task.id)}>
                      🗑 Discard
                    </Button>
                  </>
                )}
              </>
            ) : (
              <>
                {task.status === "assigned" && (
                  <Button color="orange" onClick={() => markAsStarted(task.id)}>
                    ▶️ Start
                  </Button>
                )}
                {task.status === "in_progress" && (
                  <Button color="green" onClick={() => handleDone(task.id)}>
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

  // Build tab panes
  const panes = statusTabs.map((status) => ({
    menuItem: status.charAt(0).toUpperCase() + status.slice(1),
    render: () => (
      <Tab.Pane>
        <Input
          icon={
            searchQuery
              ? {
                name: "close", link: true, onClick: () => {
                  setSearchQuery("");
                  setCurrentPage(1);
                }
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

        {/* Bulk actions for workers */}
        {!isStaff && selectedIds.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            {/* only show “Start Selected” on the Assigned tab */}
            {selectedTab === "assigned" && (
              <Button
                color="orange"
                onClick={handleBulkStart}
              >
                ▶️ Start Selected
              </Button>
            )}

            {/* only show “Complete Selected” on the In Progress tab */}
            {selectedTab === "in_progress" && (
              <Button
                color="green"
                onClick={handleBulkComplete}
                style={{ marginLeft: selectedTab === "assigned" ? "0.5rem" : "0" }}
              >
                ✅ Complete Selected
              </Button>
            )}
          </div>
        )}

        {loading ? (
          <Loader active inline="centered" size="large" />
        ) : (
          <div className="ui three stackable cards">
            {filteredTasks.map((t) => (
              <TaskCard key={t.id} task={t} selected={selectedIds.includes(t.id)} />
            ))}
          </div>
        )}

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
  }));

  return (
    <div style={{ padding: 20 }}>
      <Tab
        panes={panes}
        onTabChange={(_, data) => {
          setSelectedTab(statusTabs[data.activeIndex]);
          setCurrentPage(1);
        }}
      />

      {/* Assign Modal */}
      {isStaff && (
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
              }}
            >
              Assign Selected
            </Button>
          </Modal.Actions>
        </Modal>
      )}

      {/* Popup Window */}
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
