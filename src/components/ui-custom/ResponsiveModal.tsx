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
                className={cn("rounded-t-3xl overflow-hidden", hideHeader && "p-0 border-none")}
                style={{
                    maxHeight: '90vh',
                    paddingBottom: 'env(safe-area-inset-bottom)'
                }}
            >
                {!hideHeader && <div className="bg-muted mx-auto mt-4 h-1 w-[100px] shrink-0 rounded-full" />}
                {hideHeader ? (
                    <>
                        <VisuallyHidden>
                            <DrawerTitle>{title}</DrawerTitle>
                            <DrawerDescription>{description || title}</DrawerDescription>
                        </VisuallyHidden>
                        <div className="h-full flex flex-col">
                            {children}
                        </div>
                    </>
                ) : (
                    <>
                        <DrawerHeader className="text-left">
                            <DrawerTitle>{title}</DrawerTitle>
                            {description ? (
                                <DrawerDescription>{description}</DrawerDescription>
                            ) : (
                                <VisuallyHidden>
                                    <DrawerDescription>{title}</DrawerDescription>
                                </VisuallyHidden>
                            )}
                        </DrawerHeader>
                        <div className="px-4 pb-8 flex-1 overflow-y-auto">
                            {children}
                        </div>
                    </>
                )}
            </DrawerContent>
        </Drawer>
    )
}
