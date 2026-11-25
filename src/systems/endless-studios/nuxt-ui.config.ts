// Nuxt UI customization from the Endless Studios frontend (frontend/app/app.config.ts, `ui` key).
export default {
    button: {
      compoundVariants: [
        {
          color: 'secondary',
          variant: 'ghost',
          class: 'text-secondary-700',
        },
        {
          color: 'kids',
          variant: 'gating',
          class: {
            base: 'bg-slate-200 text-toned hover:bg-slate-300 active:bg-slate-300 disabled:opacity-75 aria-disabled:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kids',
            trailingIcon: 'text-kids',
          },
        },
      ],
      variants: {
        variant: {
          contrast: {
            base: 'bg-transparent text-inherit hover:bg-default/10 active:bg-default/10 focus-visible:bg-default/10',
          },
          gating: {},
        },
      },
    },
    colors: {
      primary: 'orange',
      secondary: 'cornflower',
      kids: 'teal',
      info: 'sky',
      warning: 'amber',
      success: 'lime',
      error: 'red',
    },
    // UAvatar. These are Nuxt UI's default classes, copied here so they can be changed. Not yet in the frontend.
    avatar: {
      slots: {
        root: 'inline-flex items-center justify-center shrink-0 select-none rounded-full align-middle bg-elevated',
        image: 'h-full w-full rounded-[inherit] object-cover',
        fallback: 'font-medium truncate text-muted',
        icon: 'shrink-0 text-muted',
      },
      variants: {
        size: {
          '3xs': { root: 'size-4 text-[8px]' },
          '2xs': { root: 'size-5 text-[10px]' },
          xs: { root: 'size-6 text-xs' },
          sm: { root: 'size-7 text-sm' },
          md: { root: 'size-8 text-base' },
          lg: { root: 'size-9 text-lg' },
          xl: { root: 'size-10 text-xl' },
          '2xl': { root: 'size-11 text-[22px]' },
          '3xl': { root: 'size-12 text-2xl' },
        },
      },
    },
    alert: {
      slots: {
        root: 'rounded-xl',
      },
    },
    badge: {
      compoundVariants: [
        {
          color: 'secondary',
          variant: 'soft',
          class: 'bg-cornflower-50 text-cornflower-700',
        },
      ],
    },
    card: {
      slots: {
        root: 'rounded-2xl',
      },
      variants: {
        variant: {
          flat: {
            root: 'ring-0 bg-default',
          },
          shaded: {
            root: 'bg-default divide-y divide-default shadow-[0_25px_50px_-12px_rgba(0,0,0,0.08)]',
          },
          soft: {
            root: 'bg-elevated',
            body: 'p-3',
          },
          ghost: {
            root: 'ring-0 bg-transparent shadow-none',
            body: 'p-0 sm:p-0',
          },
          bordered: {
            root: 'ring-0 bg-default border border-default shadow-none',
          },
        },
      },
    },
    breadcrumb: {
      slots: {
        separatorIcon: 'text-highlighted',
      },
      compoundVariants: [
        {
          color: 'neutral',
          active: true,
          class: {
            link: 'text-dimmed font-medium',
          },
        },
        {
          color: 'neutral',
          active: false,
          class: {
            link: 'text-toned',
          },
        },
      ],
    },
    carousel: {
      slots: {
        prev: 'max-md:hidden',
        next: 'max-md:hidden',
      },
    },
    container: {
      base: 'px-4 sm:px-4 md:px-12 lg:px-12',
    },
    navigationMenu: {
      compoundVariants: [
        {
          color: 'neutral',
          variant: 'pill',
          class: {
            link: 'py-2 px-3 transition-none before:transition-none no-underline',
          },
        },
        {
          color: 'neutral',
          variant: 'pill',
          active: false,
          class: {
            link: 'text-muted hover:text-default before:bg-transparent hover:before:bg-transparent',
          },
        },
        {
          color: 'neutral',
          variant: 'pill',
          active: true,
          class: {
            link: 'text-inverted before:bg-inverted',
          },
        },
      ],
    },
  }
