import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function AssistantPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Assistant tạm thời vô hiệu hóa</CardTitle>
        <CardDescription>
          Tính năng trợ lý sẽ được đưa sang backend Java và mở lại sau khi hoàn thành API.
        </CardDescription>
      </CardHeader>
      <CardContent>Endpoint đề xuất: POST /api/v1/assistant/chat.</CardContent>
    </Card>
  )
}
