import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-full border-2 border-ink font-heading font-bold whitespace-nowrap transition-[transform,box-shadow,filter] duration-150 outline-none select-none focus-visible:ring-4 focus-visible:ring-sky/60 disabled:pointer-events-none disabled:opacity-50 aria-invalid:ring-4 aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-chip hover:-translate-y-0.5 hover:shadow-chip-lift hover:brightness-105 active:translate-y-[3px] active:shadow-none",
        secondary:
          "bg-secondary text-secondary-foreground shadow-chip hover:-translate-y-0.5 hover:shadow-chip-lift hover:brightness-105 active:translate-y-[3px] active:shadow-none",
        outline:
          "bg-paper text-ink shadow-chip hover:-translate-y-0.5 hover:shadow-chip-lift hover:brightness-105 active:translate-y-[3px] active:shadow-none",
        destructive:
          "bg-destructive text-paper shadow-chip hover:-translate-y-0.5 hover:shadow-chip-lift hover:brightness-105 active:translate-y-[3px] active:shadow-none",
        ghost:
          "border-transparent bg-transparent text-foreground hover:bg-foreground/10 active:bg-foreground/20",
        link: "border-transparent text-sky underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-10 px-5 text-base has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        xs: "h-7 gap-1 px-3 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 px-4 text-sm [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 px-6 text-lg",
        xl: "h-14 px-9 text-2xl tracking-wide",
        icon: "size-10",
        "icon-xs": "size-7 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
