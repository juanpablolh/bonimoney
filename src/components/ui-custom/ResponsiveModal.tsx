import * as React from "react"
import { useMediaQuery } from "../../hooks/use-media-query"
import { cn } from "@/lib/utils"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from "@/components/ui/dialog"
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
    DrawerDescription,
} from "@/components/ui/drawer"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

interface ResponsiveModalProps {
    children: React.ReactNode
    title: string
    description?: string
    trigger?: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
    hideHeader?: boolean
    showCloseButton?: boolean
}

export function ResponsiveModal({
    children,
    title,
    description,
    trigger,
    open,
    onOpenChange,
    hideHeader = false,
    showCloseButton = true,
}: ResponsiveModalProps) {
    const isDesktop = useMediaQuery("(min-width: 768px)")
    const [viewportHeight, setViewportHeight] = React.useState<number | null>(null)

    React.useEffect(() => {
        if (isDesktop || !open) return

        const updateViewport = () => {
            if (window.visualViewport) {
                setViewportHeight(window.visualViewport.height)
            }
        }

        window.visualViewport?.addEventListener("resize", updateViewport)
        window.visualViewport?.addEventListener("scroll", updateViewport)
        updateViewport()

        return () => {
            window.visualViewport?.removeEventListener("resize", updateViewport)
            window.visualViewport?.removeEventListener("scroll", updateViewport)
        }
    }, [isDesktop, open])

    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
                <DialogContent showCloseButton={showCloseButton} className={cn("sm:max-w-[425px]", hideHeader && "p-0 border-none bg-transparent shadow-none ring-0 gap-0 overflow-visible")}>
                    {hideHeader ? (
                        <>
                            <VisuallyHidden>
                                <DialogTitle>{title}</DialogTitle>
                                <DialogDescription>{description || title}</DialogDescription>
                            </VisuallyHidden>
                            {children}
                        </>
                    ) : (
                        <>
                            <DialogHeader>
                                <DialogTitle>{title}</DialogTitle>
                                {description ? (
                                    <DialogDescription>{description}</DialogDescription>
                                ) : (
                                    <VisuallyHidden>
                                        <DialogDescription>{title}</DialogDescription>
                                    </VisuallyHidden>
                                )}
                            </DialogHeader>
                            {children}
                        </>
                    )}
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
            <DrawerContent
                hideHandle={hideHeader}
                className={cn("flex flex-col bg-background", hideHeader && "border-none")}
                style={viewportHeight ? { height: `${viewportHeight}px`, maxHeight: '100dvh' } : { height: '85dvh' }}
            >
                {!hideHeader && <div className="bg-muted mx-auto mt-4 h-1 w-[100px] shrink-0 rounded-full" />}
                <div className="flex flex-col flex-1 min-h-0 relative h-full">
                    {hideHeader ? (
                        <VisuallyHidden>
                            <DrawerTitle>{title}</DrawerTitle>
                            <DrawerDescription>{description || title}</DrawerDescription>
                        </VisuallyHidden>
                    ) : (
                        <DrawerHeader className="text-left shrink-0">
                            <DrawerTitle>{title}</DrawerTitle>
                            {description ? (
                                <DrawerDescription>{description}</DrawerDescription>
                            ) : (
                                <VisuallyHidden>
                                    <DrawerDescription>{title}</DrawerDescription>
                                </VisuallyHidden>
                            )}
                        </DrawerHeader>
                    )}
                    <div className="flex-1 flex flex-col min-h-0 h-full">
                        {children}
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
