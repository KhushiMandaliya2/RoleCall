import { createFileRoute } from '@tanstack/react-router'
import { 
  Container,
  Heading, 
  Button,
  Card,
  Text,
  Stack,
  Spinner,
  Alert,
  Badge
} from "@chakra-ui/react"
import { FiEye, FiBriefcase, FiInfo, FiAlertCircle } from "react-icons/fi"
import { useState, useEffect } from "react"

interface Job {
  id: string
  title: string
  description: string
}

function UserJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      console.log("Fetching jobs from:", "http://localhost:8000/api/v1/jobs/")
      
      const response = await fetch("http://localhost:8000/api/v1/jobs/")
      
      console.log("Response status:", response.status)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch jobs: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log("Jobs data received:", data)
      
      setJobs(data)
    } catch (error) {
      console.error("Error fetching jobs:", error)
      setError(`Failed to load jobs: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApply = async (jobId: string, jobTitle: string) => {
    try {
      console.log("Applying to job:", jobId)
      
      const response = await fetch(`http://localhost:8000/api/v1/jobs/${jobId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      
      if (!response.ok) {
        throw new Error(`Failed to apply: ${response.status}`)
      }
      
      const result = await response.json()
      console.log("Application result:", result)
      
      setAppliedJobs(prev => new Set([...prev, jobId]))
      
      alert(`Successfully applied to ${jobTitle}!`)
      
    } catch (error) {
      console.error("Error applying to job:", error)
      alert("Failed to submit application. Please try again.")
    }
  }

  const handleView = (jobId: string) => {
    console.log("Viewing job details:", jobId)
    alert(`Viewing details for job ID: ${jobId}`)
  }

  if (isLoading) {
    return (
      <Container maxW="6xl" py={8}>
        <Stack direction="column" gap={4} align="center">
          <Heading size="lg">Available Jobs</Heading>
          <Spinner size="xl" />
          <Text>Loading available positions...</Text>
        </Stack>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxW="6xl" py={8}>
        <Stack direction="column" gap={4}>
          <Alert.Root status="error">
            <Alert.Indicator>
              <FiAlertCircle />
            </Alert.Indicator>
            <Alert.Content>
              <Alert.Title>Error Loading Jobs</Alert.Title>
              <Alert.Description>{error}</Alert.Description>
            </Alert.Content>
          </Alert.Root>
          <Button onClick={fetchJobs}>
            Try Again
          </Button>
          <Text fontSize="sm" color="gray.600">
            Make sure your backend is running on http://localhost:8000
          </Text>
        </Stack>
      </Container>
    )
  }

  if (jobs.length === 0) {
    return (
      <Container maxW="6xl" py={8}>
        <Stack direction="column" gap={6}>
          <Heading size="lg">Available Jobs</Heading>
          <Alert.Root status="info">
            <Alert.Indicator>
              <FiInfo />
            </Alert.Indicator>
            <Alert.Content>
              <Alert.Title>No Jobs Available</Alert.Title>
              <Alert.Description>
                There are currently no job openings. Please check back later!
              </Alert.Description>
            </Alert.Content>
          </Alert.Root>
          <Text fontSize="sm" color="gray.600">
            Tip: Create some job postings in the Job Postings page first.
          </Text>
        </Stack>
      </Container>
    )
  }

  return (
    <Container maxW="6xl" py={8}>
      <Stack direction="column" gap={6}>
        <Stack direction="row" justify="space-between" align="center">
          <Heading size="lg">
            <FiBriefcase style={{ display: "inline", marginRight: "12px" }} />
            Available Jobs
          </Heading>
          <Badge colorScheme="blue" fontSize="md" px={3} py={1}>
            {jobs.length} {jobs.length === 1 ? 'Position' : 'Positions'} Available
          </Badge>
        </Stack>

        <Stack direction="column" gap={4}>
          {jobs.map((job) => (
            <Card.Root key={job.id} variant="outline">
              <Card.Header>
                <Stack direction="row" justify="space-between" align="start">
                  <Stack direction="column" gap={1}>
                    <Heading size="md" color="blue.600">
                      {job.title}
                    </Heading>
                    <Text fontSize="sm" color="gray.600">
                      Job ID: {job.id}
                    </Text>
                  </Stack>
                  <Stack direction="row" gap={2}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleView(job.id)}
                    >
                      <FiEye style={{ marginRight: "8px" }} />
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      colorScheme={appliedJobs.has(job.id) ? "green" : "blue"}
                      disabled={appliedJobs.has(job.id)}
                      onClick={() => handleApply(job.id, job.title)}
                    >
                      {appliedJobs.has(job.id) ? "Applied ✓" : "Apply Now"}
                    </Button>
                  </Stack>
                </Stack>
              </Card.Header>
              
              <Card.Body>
                <Text color="gray.700">
                  {job.description}
                </Text>
              </Card.Body>
            </Card.Root>
          ))}
        </Stack>
      </Stack>
    </Container>
  )
}

export default UserJobsPage
export const Route = createFileRoute("/_layout/user_jobs")({
  component: UserJobsPage,
})