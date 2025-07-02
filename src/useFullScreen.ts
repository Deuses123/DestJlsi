import { useState, useEffect, useCallback } from "react"

interface UseFullscreenReturn {
    isFullscreen: boolean
    toggleFullscreen: (element?: HTMLElement) => Promise<void>
    exitFullscreen: () => Promise<void>
    enterFullscreen: (element: HTMLElement) => Promise<void>
}

export function useFullscreen(): UseFullscreenReturn {
    const [isFullscreen, setIsFullscreen] = useState(false)

    // Проверка текущего состояния полноэкранного режима
    const checkFullscreenState = useCallback(() => {
        const isCurrentlyFullscreen = !!(
            document.fullscreenElement ||
            (document as any).webkitFullscreenElement ||
            (document as any).msFullscreenElement
        )
        setIsFullscreen(isCurrentlyFullscreen)
    }, [])

    // Вход в полноэкранный режим
    const enterFullscreen = useCallback(async (element: HTMLElement) => {
        try {
            if (element.requestFullscreen) {
                await element.requestFullscreen()
            } else if ((element as any).webkitRequestFullscreen) {
                await (element as any).webkitRequestFullscreen()
            } else if ((element as any).msRequestFullscreen) {
                await (element as any).msRequestFullscreen()
            }
        } catch (error) {
            console.error("Ошибка входа в полноэкранный режим:", error)
            throw error
        }
    }, [])

    // Выход из полноэкранного режима
    const exitFullscreen = useCallback(async () => {
        try {
            if (document.exitFullscreen) {
                await document.exitFullscreen()
            } else if ((document as any).webkitExitFullscreen) {
                await (document as any).webkitExitFullscreen()
            } else if ((document as any).msExitFullscreen) {
                await (document as any).msExitFullscreen()
            }
        } catch (error) {
            console.error("Ошибка выхода из полноэкранного режима:", error)
            throw error
        }
    }, [])

    // Переключение полноэкранного режима
    const toggleFullscreen = useCallback(
        async (element?: HTMLElement) => {
            if (isFullscreen) {
                await exitFullscreen()
            } else if (element) {
                await enterFullscreen(element)
            }
        },
        [isFullscreen, enterFullscreen, exitFullscreen],
    )

    // Обработчики событий для разных браузеров
    useEffect(() => {
        const events = ["fullscreenchange", "webkitfullscreenchange", "msfullscreenchange"]

        events.forEach((event) => {
            document.addEventListener(event, checkFullscreenState)
        })

        // Проверяем состояние при монтировании
        checkFullscreenState()

        return () => {
            events.forEach((event) => {
                document.removeEventListener(event, checkFullscreenState)
            })
        }
    }, [checkFullscreenState])

    return {
        isFullscreen,
        toggleFullscreen,
        exitFullscreen,
        enterFullscreen,
    }
}
