import React, { useEffect, useState } from "react";
import axios from 'axios';
import {
  Modal,
  Tab,
  Card,
  Checkbox,
  Button,
  Image,
  Label,
  Icon,
  Dropdown,
  Input,
  Pagination,
  Dimmer, Loader
} from "semantic-ui-react";

import sampleTasks from "./sample_tasks";

const API_BASE_URL = 'http://localhost:8000/api/tasks';



async function getTasks(params = {}) {
  const response = await axios.get(API_BASE_URL, { params });
  console.log(response.data)
  return response.data;
}

async function getWorkers(params = {}) {
  const response = await axios.get(API_BASE_URL + "/getWorkers", { params });
  console.log(response.data)
  return response.data;
}


async function updateTasks(taskUpdates) {
  const response = await axios.put(`${API_BASE_URL}/bulk`, taskUpdates);
  return response.data;
}

const sortOptions = [
  { key: "recent", text: "Most Recent", value: "recent" },
  { key: "oldest", text: "Oldest", value: "oldest" },
];

const statusTabs = ["all", "unverified", "verified", "assigned", "completed"];


const getColor = (status) => {
  switch (status) {
    case "created":
      return "grey";
    case "assigned":
      return "blue";
    case "in progress":
      return "yellow";
    case "completed":
      return "green";
    default:
      return "teal";
  }
};


const TaskAssigningPage = () => {
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState("all");
  const [tasks, setTasks] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("recent");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  //assign workers
  const [users, setUsers] = useState([]);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState(null);

  async function fetchTasks() {
    setLoading(true);
    try {
      const data = await getTasks();
      const fetchedTasks = data.tasks.map(entry => ({
        id: entry.task_id,
        image: entry.image_url,
        title: entry.label,
        // confidence: 62,
        progress_status: entry.progress_status,
        verification_status: entry.verification_status,
        assignedTo: entry.worker_first_name ?? "Unassigned",
        verifiedBy: "",
        location: entry.street,
        timestamp: entry.created_at,
        ...entry,
      }));
      setTasks(fetchedTasks)
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchWorkers() {
    try {
      const data = await getWorkers();
      const formatedWorkers = data.map(user => ({
        key: user.id,
        value: user.id,
        text: `${user.firstName} ${user.lastName}`
      }));

      setUsers(formatedWorkers)
    } catch (error) {
      console.error(error);
    }
  }


  useEffect(() => {
    fetchTasks();
    fetchWorkers();
  }, [])

  const handleVerify = async (id = null) => {
    if (selectedIds.length === 0 && id == null) {
      return
    }

    const updateIds = id ? [id] : selectedIds;

    const update = updateIds.map(id => ({
      task_id: id,
      verification_status: 'verified'
    }));
    console.log(update)
    await updateTasks(update)
    fetchTasks()

  }

  const handleAssign = async (id = null) => {
    if (selectedIds.length === 0 && id == null) {
      return
    }
    const updateIds = id ? [id] : selectedIds;

    const update = updateIds.map(id => ({
      task_id: id,
      progress_status: 'assigned',
      worker_id: selectedWorkerId
    }));
    console.log(update)
    await updateTasks(update)
    fetchTasks()
  }

  const handleDone = async (id = null) => {
    if (selectedIds.length === 0 && id == null) {
      return
    }
    const updateIds = id ? [id] : selectedIds;

    const update = updateIds.map(id => ({
      task_id: id,
      progress_status: 'completed'
    }));
    console.log(update)
    await updateTasks(update)
    fetchTasks()

  }

    const handleDiscard = async (id = null) => {
    if (selectedIds.length === 0 && id == null) {
      return
    }
    const updateIds = id ? [id] : selectedIds;

    const update = updateIds.map(id => ({
      task_id: id,
      verification_status: 'discarded'
    }));
    console.log(update)
    await updateTasks(update)
    fetchTasks()

  }

  const handleSelect = (id = null) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const getFilteredTasks = () => {
    let filtered = tasks.filter((task) => {
      const matchesStatus =
        selectedTab === "all" || task.progress_status === selectedTab || task.verification_status === selectedTab;
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.assignedTo &&
          task.assignedTo.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesStatus && matchesSearch;
    });

    if (sortOrder === "recent") {
      filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } else if (sortOrder === "oldest") {
      filtered.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }

    return filtered;
  };

  const TaskCard = ({ curTab, task, selected, onSelect }) => (
    <Card fluid>
      <Checkbox
        checked={selected}
        onChange={() => onSelect(task.id)}
        style={{ position: "absolute", top: 10, left: 10, zIndex: 1 }}
      />

      <Image src={task.image} wrapped ui={false} />
      <Card.Content>
        <Card.Header>{task.title}</Card.Header>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
          <Card.Meta style={{ fontSize: "0.9em", color: "grey" }}>
            Confidence: {task.confidence}%
          </Card.Meta>
          <span style={{ fontSize: "0.9em", color: "grey" }}>
            {task.verification_status === 'verified' ? (
              <>
                <span style={{ color: "green", fontSize: "1.2em" }}>●</span> Verified
              </>
            ) : (
              <>
                <span style={{ color: "orange", fontSize: "1.2em" }}>●</span> Unverified
              </>
            )}
          </span>
        </div>
        <Card.Description>
          <p>
            <strong>Location:</strong> {task.location}
          </p>
          <p>
            <strong>Progress Status:</strong>{" "}
            <Label color={getColor(task.progress_status)}>{task.progress_status}</Label>
          </p>

          {task.assignedTo && (
            <p>
              <strong>Assigned to:</strong> {task.assignedTo}
            </p>
          )}
          {task.verifiedBy && (
            <p>
              <strong>Verified by:</strong> {task.verifiedBy}
            </p>
          )}
          <p>
            <strong>Timestamp:</strong> {task.timestamp}
          </p>
        </Card.Description>
      </Card.Content>
      <Card.Content extra>
        {<Button basic color="red" onClick={() => handleDiscard(task.id)}>
          🗑️ Discard
        </Button>}
        <Button basic color="blue" onClick={() => {
          setSelectedIds([task.id])
          setAssignModalOpen(true)
        }}>
          👤 Assign
        </Button>
        <Button basic color="green" onClick={() => handleDone(task.id)}>
          ✅ Mark Done
        </Button>
      </Card.Content>
    </Card>
  );

  const panes = statusTabs.map((status) => ({
    menuItem: status.charAt(0).toUpperCase() + status.slice(1),
    render: () => {
      const filteredTasks = getFilteredTasks().filter((task) =>
        status === "all" ? true : task.progress_status === selectedTab || task.verification_status === selectedTab
      );
      const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
      const paginatedTasks = filteredTasks.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      );

      return (
        <Tab.Pane>
          <Input
            icon={
              searchQuery
                ? {
                  name: "close",
                  link: true,
                  onClick: () => {
                    setSearchQuery("");
                    setCurrentPage(1);
                  },
                }
                : "search"
            }
            placeholder="Search by label, location, or assignee..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            style={{ marginBottom: 20, width: "100%" }}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            {/* Left side: sort + select all */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <Dropdown
                selection
                options={sortOptions}
                placeholder="Sort by time"
                value={sortOrder}
                onChange={(e, { value }) => {
                  setSortOrder(value);
                  setCurrentPage(1);
                }}
                style={{ minWidth: 200 }}
              />

              <Checkbox
                label="Select All Tasks"
                checked={
                  filteredTasks.length > 0 &&
                  filteredTasks.every((task) => selectedIds.includes(task.id))
                }
                onChange={(e, { checked }) => {
                  const allFilteredIds = filteredTasks.map((task) => task.id);
                  setSelectedIds((prev) =>
                    checked
                      ? Array.from(new Set([...prev, ...allFilteredIds]))
                      : prev.filter((id) => !allFilteredIds.includes(id))
                  );
                }}
              />
            </div>

            {/* Right side: action buttons */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                flexWrap: "wrap",
              }}
            >
              <Label>
                <strong>{selectedIds.length}</strong> tasks selected
              </Label>
              <Button color="blue" disabled={selectedIds.length === 0} onClick={() => handleVerify()}>
                🖊 Verify Selected
              </Button>
              <Button color="green" disabled={selectedIds.length === 0} onClick={() => setAssignModalOpen(true)}>
                👤 Assign Selected
              </Button>
              <Button color="grey" disabled={selectedIds.length === 0} onClick={() => handleDone()}>
                ✅ Mark as Done
              </Button>
            </div>
          </div>

          <div style={{ position: 'relative', minHeight: '300px' }}>
            {loading && (
              <Loader active inline="centered" size="large">
                Loading Tasks...
              </Loader>
            )}

            <div className="ui three stackable cards">
              {paginatedTasks.map(task => (
                <TaskCard
                  key={task.id}
                  curTab={status}
                  task={task}
                  selected={selectedIds.includes(task.id)}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          </div>

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
      );
    },
  }));

  const AssignModal = (
    <Modal
      open={assignModalOpen}
      onClose={() => setAssignModalOpen(false)}
      size="small"
    >
      <Modal.Header>Assign Tasks to a Worker</Modal.Header>
      <Modal.Content>
        <p>Select a worker to assign the selected tasks:</p>
        <Dropdown
          placeholder="Select Worker"
          fluid
          selection
          options={users}
          value={selectedWorkerId}
          onChange={(e, { value }) => setSelectedWorkerId(value)}
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
          const newStatus = statusTabs[data.activeIndex];
          setSelectedTab(newStatus);
          setCurrentPage(1);
        }}
      />
      {AssignModal}
    </div>
  );
};

export default TaskAssigningPage;
