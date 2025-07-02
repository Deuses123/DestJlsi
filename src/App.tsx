"use client"
import { useEffect, useRef, useState } from "react"
import { Button } from "./components/button"
import { Card, CardContent, CardHeader, CardTitle } from "./components/card"
import { Input } from "./components/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./components/dialog"
import { Badge } from "./components/badge"
import { Monitor, Maximize, Minimize, Phone, PhoneCall, Plus, Users, Copy, Check } from "lucide-react"
import Peer from "peerjs"
import "./global.css"

type AppUser = {
  id: string
  name: string
}

export default function App() {
  const [myId, setMyId] = useState("")
  const [myName, setMyName] = useState("")
  const [knownUsers, setKnownUsers] = useState<AppUser[]>([])
  const [targetUser, setTargetUser] = useState<AppUser | null>(null)
  const [peerCall, setPeerCall] = useState<any>(null)
  const [callState, setCallState] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [newUserName, setNewUserName] = useState("")
  const [newUserId, setNewUserId] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected")
  const [copied, setCopied] = useState(false)

  const remoteRef = useRef<HTMLVideoElement>(null)
  const peerRef = useRef<Peer | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const currentStreamRef = useRef<MediaStream | null>(null)

  // Утилита для безопасной очистки видео
  const clearVideoSource = (videoElement: HTMLVideoElement) => {
    try {
      if (videoElement.srcObject && videoElement.srcObject instanceof MediaStream) {
        const stream = videoElement.srcObject as MediaStream
        stream.getTracks().forEach((track) => track.stop())
      }
      videoElement.srcObject = null
      videoElement.src = ""
      videoElement.load()
    } catch (error) {
      console.error("Ошибка при очистке видео:", error)
    }
  }

  // Остановка текущего потока
  const stopCurrentStream = () => {
    if (currentStreamRef.current) {
      currentStreamRef.current.getTracks().forEach((track) => track.stop())
      currentStreamRef.current = null
    }
    setIsSharing(false)
  }

  // Инициализация
  useEffect(() => {
    const storedId = localStorage.getItem("my_id")
    const storedName = localStorage.getItem("my_name")

    if (!storedId || !storedName) {
      const name = prompt("Введите ваше имя:") || "Пользователь"
      const id = crypto.randomUUID()
      localStorage.setItem("my_id", id)
      localStorage.setItem("my_name", name)
      setMyId(id)
      setMyName(name)
    } else {
      setMyId(storedId)
      setMyName(storedName)
    }

    const savedUsers = JSON.parse(localStorage.getItem("known_users") || "[]")
    setKnownUsers(savedUsers)
  }, [])

  // Peer инициализация
  useEffect(() => {
    if (!myId) return

    setConnectionStatus("connecting")
    const peer = new Peer(myId)
    peerRef.current = peer

    peer.on("open", (id: string) => {
      console.log("Peer открыт:", id)
      setConnectionStatus("connected")
    })

    peer.on("call", (call: any) => {
      console.log("Входящий звонок от:", call.peer)
      setPeerCall(call)
      setCallState(true)
    })

    peer.on("error", (error: any) => {
      console.error("Ошибка Peer:", error)
      setConnectionStatus("disconnected")
    })

    peer.on("disconnected", () => {
      console.log("Peer отключен")
      setConnectionStatus("disconnected")
    })

    return () => {
      stopCurrentStream()
      if (peerRef.current) {
        peerRef.current.destroy()
        peerRef.current = null
      }
    }
  }, [myId])

  // Полноэкранный режим
  const toggleFullscreen = async () => {
    const container = containerRef.current
    if (!container) return

    try {
      if (!isFullscreen) {
        await container.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch (error) {
      console.error("Ошибка переключения полноэкранного режима:", error)
    }
  }

  // Обработка выхода из полноэкранного режима
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  // Вызов пользователя с screen sharing
  const callToUser = async (user: AppUser) => {
    if (!peerRef.current) {
      alert("Peer не подключен")
      return
    }

    try {
      // Получаем screen sharing поток
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      })

      currentStreamRef.current = stream
      setIsSharing(true)
      setTargetUser(user)

      const call = peerRef.current.call(user.id, stream)

      call.on("stream", (remoteStream: MediaStream) => {
        console.log("Получен удаленный поток")
        if (remoteRef.current) {
          remoteRef.current.srcObject = remoteStream
          setIsConnected(true)
        }
      })

      call.on("close", () => {
        console.log("Звонок завершен")
        endCall()
      })

      // Обработка завершения screen sharing
      stream.getVideoTracks()[0].addEventListener("ended", () => {
        console.log("Screen sharing завершен")
        endCall()
      })
    } catch (err) {
      console.error("Ошибка при получении screen sharing:", err)
      alert("Не удалось получить доступ к экрану")
    }
  }

  // Ответ на звонок
  const answerCall = async () => {
    if (!peerCall) return

    try {
      // Получаем screen sharing поток для ответа
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      })

      currentStreamRef.current = stream
      setIsSharing(true)

      peerCall.answer(stream)
      setCallState(false)

      peerCall.on("stream", (remoteStream: MediaStream) => {
        console.log("Получен удаленный поток при ответе")
        if (remoteRef.current) {
          remoteRef.current.srcObject = remoteStream
          setIsConnected(true)
        }
      })

      peerCall.on("close", () => {
        console.log("Звонок завершен")
        endCall()
      })

      // Обработка завершения screen sharing
      stream.getVideoTracks()[0].addEventListener("ended", () => {
        console.log("Screen sharing завершен")
        endCall()
      })
    } catch (err) {
      console.error("Ошибка при ответе на звонок:", err)
      alert("Не удалось получить доступ к экрану")
      rejectCall()
    }
  }

  // Добавить пользователя
  const handleAddUser = () => {
    if (!newUserName.trim() || !newUserId.trim()) {
      alert("Заполните все поля")
      return
    }

    const exists = knownUsers.find((u) => u.name === newUserName || u.id === newUserId)
    if (exists) {
      alert("Пользователь с таким именем или ID уже существует")
      return
    }

    const newUser: AppUser = { id: newUserId.trim(), name: newUserName.trim() }
    const updated = [...knownUsers, newUser]
    localStorage.setItem("known_users", JSON.stringify(updated))
    setKnownUsers(updated)
    setNewUserName("")
    setNewUserId("")
    setShowAddDialog(false)
  }

  // Завершить звонок
  const endCall = () => {
    stopCurrentStream()
    setIsConnected(false)
    setTargetUser(null)
    setCallState(false)
    setPeerCall(null)

    if (remoteRef.current) {
      clearVideoSource(remoteRef.current)
    }
  }

  // Отклонить звонок
  const rejectCall = () => {
    if (peerCall) {
      peerCall.close()
    }
    setCallState(false)
    setPeerCall(null)
  }

  // Удалить пользователя
  const removeUser = (userId: string) => {
    const updated = knownUsers.filter((user) => user.id !== userId)
    localStorage.setItem("known_users", JSON.stringify(updated))
    setKnownUsers(updated)
  }

  // Копировать ID
  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(myId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Ошибка копирования:", err)
    }
  }

  const getStatusColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "bg-green-500"
      case "connecting":
        return "bg-yellow-500"
      default:
        return "bg-red-500"
    }
  }

  const getStatusText = () => {
    switch (connectionStatus) {
      case "connected":
        return "Подключен"
      case "connecting":
        return "Подключение..."
      default:
        return "Отключен"
    }
  }

  return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        {/* Основной контейнер видео */}
        <div ref={containerRef} className={`relative ${isFullscreen ? "fixed inset-0 z-50" : "h-screen"} bg-black`}>
          {/* Удаленное видео */}
          <video
              ref={remoteRef}
              autoPlay
              playsInline
              className="w-full h-full object-contain bg-black"
              onError={(e) => console.error("Ошибка видео:", e)}
          />

          {/* Оверлей с информацией о звонке */}
          {isConnected && (
              <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
                <div className="bg-black/70 backdrop-blur-md rounded-xl px-4 py-3 border border-white/10">
                  <div className="flex items-center gap-3 text-white">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50" />
                    <div>
                      <div className="text-sm font-medium">
                        {targetUser ? `Подключен к ${targetUser.name}` : "Активный звонок"}
                      </div>
                      {isSharing && (
                          <div className="text-xs text-green-400 flex items-center gap-1">
                            <Monitor className="h-3 w-3" />
                            Демонстрация экрана
                          </div>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                    onClick={toggleFullscreen}
                    size="icon"
                    variant="secondary"
                    className="bg-black/70 backdrop-blur-md hover:bg-black/80 text-white border border-white/10"
                    title={isFullscreen ? "Выйти из полноэкранного режима" : "Полноэкранный режим"}
                >
                  {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                </Button>
              </div>
          )}

          {/* Элементы управления звонком */}
          {isConnected && (
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
                <div className="flex items-center gap-4 bg-black/70 backdrop-blur-md rounded-2xl px-8 py-4 border border-white/10">
                  <Button
                      onClick={endCall}
                      size="icon"
                      variant="destructive"
                      className="rounded-full bg-red-500 hover:bg-red-600 w-12 h-12 shadow-lg shadow-red-500/25"
                      title="Завершить звонок"
                  >
                    <Phone className="h-5 w-5" />
                  </Button>
                </div>
              </div>
          )}

          {/* Панель управления (когда не в звонке) */}
          {!isConnected && (
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <Card className="w-full max-w-lg bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                  <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center gap-3 text-white text-2xl">
                      <Monitor className="h-8 w-8 text-blue-400" />
                      Screen Share
                    </CardTitle>
                    <div className="space-y-3 mt-4">
                      <div className="flex items-center justify-center gap-2">
                        <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                          {myName}
                        </Badge>
                        <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
                        <span className="text-xs text-white/70">{getStatusText()}</span>
                      </div>
                      <div className="flex items-center justify-center gap-2 bg-black/30 rounded-lg px-3 py-2">
                        <code className="text-xs text-white/90 font-mono">{myId}</code>
                        <Button
                            onClick={copyId}
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-white/70 hover:text-white hover:bg-white/10"
                        >
                          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Входящий звонок */}
                    {callState && (
                        <div className="p-4 border rounded-xl bg-green-500/20 border-green-400/30 backdrop-blur-sm">
                          <div className="flex items-center justify-between">
                            <div className="text-white">
                              <div className="font-medium flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                Входящий звонок
                              </div>
                              <div className="text-sm text-white/70">Пользователь хочет поделиться экраном</div>
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={answerCall} size="sm" className="bg-green-600 hover:bg-green-700">
                                <PhoneCall className="h-4 w-4 mr-2" />
                                Принять
                              </Button>
                              <Button onClick={rejectCall} size="sm" variant="destructive">
                                <Phone className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                    )}

                    {/* Список пользователей */}
                    {knownUsers.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-3 text-white flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Контакты ({knownUsers.length})
                          </h4>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {knownUsers.map((user) => (
                                <div
                                    key={user.id}
                                    className="flex items-center justify-between p-3 border border-white/10 rounded-lg hover:bg-white/5 transition-all duration-200"
                                >
                                  <div className="flex-1 min-w-0 text-white">
                                    <div className="font-medium truncate">{user.name}</div>
                                    <div className="text-xs text-white/50 truncate font-mono">{user.id}</div>
                                  </div>
                                  <div className="flex gap-2 ml-2">
                                    <Button
                                        onClick={() => callToUser(user)}
                                        size="sm"
                                        className="bg-blue-600 hover:bg-blue-700"
                                        disabled={connectionStatus !== "connected"}
                                    >
                                      <Monitor className="h-4 w-4 mr-2" />
                                      Поделиться
                                    </Button>
                                    <Button
                                        onClick={() => removeUser(user.id)}
                                        size="sm"
                                        variant="ghost"
                                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                        title="Удалить контакт"
                                    >
                                      ×
                                    </Button>
                                  </div>
                                </div>
                            ))}
                          </div>
                        </div>
                    )}

                    {knownUsers.length === 0 && !callState && (
                        <div className="text-center py-8 text-white/70">
                          <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                          <p className="text-lg font-medium">Нет контактов</p>
                          <p className="text-sm">Добавьте контакт для демонстрации экрана</p>
                        </div>
                    )}

                    {/* Добавить пользователя */}
                    <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                      <DialogTrigger asChild>
                        <Button
                            variant="outline"
                            className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Добавить контакт
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-gray-900/95 backdrop-blur-xl border-white/20 text-white">
                        <DialogHeader>
                          <DialogTitle className="text-white">Добавить новый контакт</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium block mb-2 text-white/90">Имя пользователя</label>
                            <Input
                                value={newUserName}
                                onChange={(e) => setNewUserName(e.target.value)}
                                placeholder="Введите имя"
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                                onKeyDown={(e) => e.key === "Enter" && handleAddUser()}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium block mb-2 text-white/90">ID пользователя</label>
                            <Input
                                value={newUserId}
                                onChange={(e) => setNewUserId(e.target.value)}
                                placeholder="Введите ID"
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 font-mono"
                                onKeyDown={(e) => e.key === "Enter" && handleAddUser()}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={handleAddUser} className="flex-1 bg-blue-600 hover:bg-blue-700">
                              Добавить
                            </Button>
                            <Button
                                onClick={() => setShowAddDialog(false)}
                                variant="outline"
                                className="flex-1 border-white/20 text-white hover:bg-white/10"
                            >
                              Отмена
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              </div>
          )}
        </div>
      </div>
  )
}
