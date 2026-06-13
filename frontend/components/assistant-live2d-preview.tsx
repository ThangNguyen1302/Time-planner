"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Live2DAvatar } from "@/components/live2d"

export function AssistantLive2DPreview() {
  const [hasError, setHasError] = useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Xem trước model</CardTitle>
        <CardDescription>Hiển thị Live2D bên cạnh phần chỉnh sửa</CardDescription>
      </CardHeader>
      <CardContent>
        {hasError ? (
          <div className="flex items-center justify-center bg-muted/20 rounded-xl h-130">
            <p className="text-sm text-muted-foreground">Không thể tải Live2D</p>
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <Live2DAvatar
              modelPath="/live2d/hiyori/huohuo/huohuo.model3.json"
              width={320}
              height={520}
              onError={() => setHasError(true)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
