import React, { useState } from "react";
import {
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
} from "semantic-ui-react";

import sampleTasks from "./sample_tasks";

const sortOptions = [
  { key: "recent", text: "Most Recent", value: "recent" },
  { key: "oldest", text: "Oldest", value: "oldest" },
];

const statusTabs = ["all", "unverified", "verified", "assigned", "finished"];

const getColor = (status) => {
  switch (status) {
    case "unverified":
      return "yellow";
    case "verified":
      return "green";
    case "assigned":
      return "blue";
    case "finished":
      return "grey";
    default:
      return "teal";
  }
};

const TaskCard = ({ task, selected, onSelect }) => (
  <Card fluid>
    <Checkbox
      checked={selected}
      onChange={() => onSelect(task.id)}
      style={{ position: "absolute", top: 10, left: 10, zIndex: 1 }}
    />
    <Image src={task.image} wrapped ui={false} />
    <Card.Content>
      <Card.Header>{task.title}</Card.Header>
      <Card.Meta>Confidence: {task.confidence}%</Card.Meta>
      <Card.Description>
        <p>
          <strong>Location:</strong> {task.location}
        </p>
        <p>
          <strong>Status:</strong>{" "}
          <Label color={getColor(task.status)}>{task.status}</Label>
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
      <Button basic color="blue">
        👤 Assign
      </Button>
      <Button basic color="green">
        ✅ Mark Done
      </Button>
    </Card.Content>
  </Card>
);

const TaskAssigningPage = () => {
  const [selectedTab, setSelectedTab] = useState("all");
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("recent");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const handleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const getFilteredTasks = () => {
    let filtered = sampleTasks.filter((task) => {
      const matchesStatus =
        selectedTab === "all" || task.status === selectedTab;
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

  const panes = statusTabs.map((status) => ({
    menuItem: status.charAt(0).toUpperCase() + status.slice(1),
    render: () => {
      const filteredTasks = getFilteredTasks().filter((task) =>
        status === "all" ? true : task.status === status
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
              <Button color="blue" disabled={selectedIds.length === 0}>
                🖊 Verify Selected
              </Button>
              <Button color="green" disabled={selectedIds.length === 0}>
                👤 Assign Selected
              </Button>
              <Button color="grey" disabled={selectedIds.length === 0}>
                ✅ Mark as Done
              </Button>
            </div>
          </div>

          <div className="ui three stackable cards">
            {paginatedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                selected={selectedIds.includes(task.id)}
                onSelect={handleSelect}
              />
            ))}
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
    </div>
  );
};

export default TaskAssigningPage;
