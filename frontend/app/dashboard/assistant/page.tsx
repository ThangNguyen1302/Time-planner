import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function AssistantPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Assistant tam thoi vo hieu hoa</CardTitle>
        <CardDescription>
          Tinh nang tro ly se duoc dua sang backend Java va mo lai sau khi hoan thanh API.
        </CardDescription>
      </CardHeader>
      <CardContent>Endpoint de xuat: POST /api/v1/assistant/chat.</CardContent>
    </Card>
  )
}
