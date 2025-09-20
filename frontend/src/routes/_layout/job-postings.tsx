import { createFileRoute } from '@tanstack/react-router'
import { 
  Box, 
  Heading, 
  Button, 
  Input, 
  Flex, 
  Menu,  
  IconButton 
} from "@chakra-ui/react"
import { FiPlus, FiMoreVertical, FiEdit, FiTrash2 } from "react-icons/fi"
import { useState, useEffect } from "react"

function JobPostingsPage() {
  const [jobPostings, setJobPostings] = useState<{ id: string; title: string; description: string }[]>([])
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)

  // Fetch job postings from backend
  useEffect(() => {
    fetch("http://localhost:8000/api/v1/job_postings/")
      .then(res => res.json())
      .then(data => setJobPostings(data))
  }, [])

  // Add new job posting
  const handleAdd = async () => {
    if (editingId) {
      // If editing, update the existing job
      try {
        const response = await fetch(`http://localhost:8000/api/v1/job_postings/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description }),
        })
        
        if (response.ok) {
          setTitle("")
          setDescription("")
          setEditingId(null)
          // Refresh job postings
          fetch("http://localhost:8000/api/v1/job_postings/")
            .then(res => res.json())
            .then(data => setJobPostings(data))
        }
      } catch (error) {
        console.error("Error updating job posting:", error)
      }
    } else {
      // If not editing, create new job
      await fetch("http://localhost:8000/api/v1/job_postings/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      })
      setTitle("")
      setDescription("")
      // Refresh job postings
      fetch("http://localhost:8000/api/v1/job_postings/")
        .then(res => res.json())
        .then(data => setJobPostings(data))
    }
  }

  const handleEdit = (jobId: string) => {
    const jobToEdit = jobPostings.find(job => job.id === jobId)
    if (jobToEdit) {
      setTitle(jobToEdit.title)
      setDescription(jobToEdit.description)
      setEditingId(jobId)
      console.log("Editing job:", jobId)
    }
  }

  const handleDelete = async (jobId: string) => {
    if (confirm("Are you sure you want to delete this job posting?")) {
      try {
        const response = await fetch(`http://localhost:8000/api/v1/job_postings/${jobId}`, {
          method: "DELETE",
        })
        
        if (response.ok) {
          // Remove from local state immediately for better UX
          setJobPostings(jobPostings.filter(job => job.id !== jobId))
          console.log("Job posting deleted successfully")
        } else {
          console.error("Failed to delete job posting")
          alert("Failed to delete job posting")
        }
      } catch (error) {
        console.error("Error deleting job posting:", error)
        alert("Error deleting job posting")
      }
    }
  }

  const handleCancel = () => {
    setTitle("")
    setDescription("")
    setEditingId(null)
  }

  return (
    <Box w="100%" p={8} bg="white" borderRadius="md" boxShadow="md" mt={8}>
      <Heading mb={6} size="lg">Job Postings Management</Heading>
      <Flex mb={4} gap={2}>
        <Input
          placeholder="Job Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          width="200px"
        />
        <Input
          placeholder="Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          width="300px"
        />
        <Button colorScheme="teal" onClick={handleAdd}>
          <FiPlus style={{ marginRight: "8px" }} />
          {editingId ? "Update Job Posting" : "Add Job Posting"}
        </Button>
        {editingId && (
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
        )}
      </Flex>
      <Box w="100%">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f7fafc" }}>
              <th style={{ padding: "12px", borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>ID</th>
              <th style={{ padding: "12px", borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>Job Title</th>
              <th style={{ padding: "12px", borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>Description</th>
              <th style={{ padding: "12px", borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobPostings.map(job => (
              <tr key={job.id}>
                <td style={{ padding: "10px", borderBottom: "1px solid #e2e8f0" }}>{job.id}</td>
                <td style={{ padding: "10px", borderBottom: "1px solid #e2e8f0" }}>{job.title}</td>
                <td style={{ padding: "10px", borderBottom: "1px solid #e2e8f0" }}>{job.description}</td>
                <td style={{ padding: "10px", borderBottom: "1px solid #e2e8f0", textAlign: "center" }}>
                  <Menu.Root>
                    <Menu.Trigger asChild>
                      <IconButton
                        variant="ghost"
                        size="sm"
                        aria-label="Actions"
                      >
                        <FiMoreVertical />
                      </IconButton>
                    </Menu.Trigger>
                    <Menu.Content>
                      <Menu.Item value="edit" onClick={() => handleEdit(job.id)}>
                        <FiEdit style={{ marginRight: "8px" }} />
                        Edit
                      </Menu.Item>
                      <Menu.Item value="delete" onClick={() => handleDelete(job.id)}>
                        <FiTrash2 style={{ marginRight: "8px" }} />
                        Delete
                      </Menu.Item>
                    </Menu.Content>
                  </Menu.Root>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>
    </Box>
  )
}

export default JobPostingsPage
export const Route = createFileRoute("/_layout/job-postings")({
  component: JobPostingsPage,
})