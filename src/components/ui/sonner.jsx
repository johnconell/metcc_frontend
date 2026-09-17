import { Toaster as Sonner } from 'sonner';

/**
 * shadcn-style Sonner toaster — mount once near the app root.
 */
export function Toaster(props) {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="top-center"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-white group-[.toaster]:text-[#26251e] group-[.toaster]:border group-[.toaster]:border-[#e6e5e0] group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-[#807d72]',
          actionButton:
            'group-[.toast]:bg-[#7B1020] group-[.toast]:text-white',
          cancelButton:
            'group-[.toast]:bg-[#efeee8] group-[.toast]:text-[#5a5852]',
          error:
            'group-[.toaster]:border-[#cf2d56]/30 group-[.toaster]:text-[#7B1020]',
          success:
            'group-[.toaster]:border-[#1f8a65]/30',
        },
      }}
      {...props}
    />
  );
}
