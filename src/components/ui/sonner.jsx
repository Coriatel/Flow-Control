import { Toaster as SonnerToaster } from "sonner";

const Toaster = ({ position = "top-right", ...props }) => {
  return (
    <SonnerToaster 
      className="toaster"
      position={position}
      {...props}
    />
  );
};

export { Toaster };