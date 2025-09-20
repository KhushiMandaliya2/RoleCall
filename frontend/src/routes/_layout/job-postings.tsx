import { createFileRoute } from '@tanstack/react-router'
import { Box, Heading, Button, Input, Flex } from "@chakra-ui/react"
import { FiPlus } from "react-icons/fi"
import { useState, useEffect } from "react"

function JobPostingsPage() {
  const [jobPostings, setJobPostings] = useState<{ id: string; title: string; description: string }[]>([])
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")

  // Fetch job postings from backend
  useEffect(() => {
    fetch("http://localhost:8000/api/v1/job_postings/")
      .then(res => res.json())
      .then(data => setJobPostings(data))
  }, [])

  // Add new job posting
  const handleAdd = async () => {
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
          Add Job Posting
        </Button>
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
                  <span style={{ fontSize: "24px", cursor: "pointer" }}>⋮</span>
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