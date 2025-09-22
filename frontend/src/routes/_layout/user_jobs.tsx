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
import useAuth from "@/hooks/useAuth"

interface Job {
  id: string
  title: string
  description: string
  has_applied: boolean
  user_id: string | null
}

function UserJobsPage() {
  const { user: currentUser } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (currentUser?.id) {
      fetchJobs()
    } else if (currentUser === null) {
      // User is not logged in
      setError("Please log in to view available jobs")
      setIsLoading(false)
    }
  }, [currentUser])

  const fetchJobs = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Pass user_id as query parameter
      const response = await fetch(`http://localhost:8000/api/v1/jobs/?user_id=${currentUser.id}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch jobs: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      setJobs(data)
      
    } catch (error) {
      console.error("Error fetching jobs:", error)
      setError(`Failed to load jobs: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApply = async (jobId: string, jobTitle: string) => {
    if (!currentUser?.id) {
    alert("Please log in to apply for jobs")
    return
  }
    try {
      // Pass user_id as query parameter
      const response = await fetch(`http://localhost:8000/api/v1/jobs/${jobId}/apply?user_id=${currentUser.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || `Failed to apply: ${response.status}`)
      }
      
      const result = await response.json()
      
      // Update the specific job's has_applied status
      setJobs(prevJobs => 
        prevJobs.map(job => 
          job.id === jobId 
            ? { ...job, has_applied: true }
            : job
        )
      )
      
      alert(`Successfully applied to ${jobTitle}!`)
      
    } catch (error) {
      console.error("Error applying to job:", error)
      alert(error instanceof Error ? error.message : "Failed to submit application. Please try again.")
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

  // Add this check before other conditions
  if (!currentUser && !isLoading) {
    return (
      <Container maxW="6xl" py={8}>
        <Alert.Root status="warning">
          <Alert.Indicator>
            <FiAlertCircle />
          </Alert.Indicator>
          <Alert.Content>
            <Alert.Title>Login Required</Alert.Title>
            <Alert.Description>
              Please log in to view and apply for available jobs.
            </Alert.Description>
          </Alert.Content>
        </Alert.Root>
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

        {jobs.length === 0 ? (
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
        ) : (
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
                      {job.has_applied && (
                        <Badge colorScheme="green" size="sm">
                          Already Applied
                        </Badge>
                      )}
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
                        colorScheme={job.has_applied ? "green" : "blue"}
                        disabled={job.has_applied}
                        onClick={() => handleApply(job.id, job.title)}
                      >
                        {job.has_applied ? "Applied ✓" : "Apply Now"}
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
        )}
      </Stack>
    </Container>
  )
}

export default UserJobsPage
export const Route = createFileRoute("/_layout/user_jobs")({
  component: UserJobsPage,
})