// packages/ui/src/toast.tsx
"use client";

import { Toast } from "react-bootstrap";

export function ToastContainer({ toasts }: any) {
  return (
    <div className="fixed right-2 top-20 z-[99999] space-y-3">
      {toasts.map((toast: any) => (
        <Toast
          key={toast.id}
          show={true} // ← yeh missing tha, isliye hide tha
          autohide
          delay={4000}
          className={`colored-toast bg-${toast.type}-transparent bg-green`}
        >
          <Toast.Header
            closeButton
            className={`rounded-md bg-${toast.type} px-4 py-2 text-white shadow-lg`}
          >
            <strong className="me-auto capitalize">{toast.type}</strong>
          </Toast.Header>
          <Toast.Body className="px-4 py-2 capitalize text-white">
            {toast.message}
          </Toast.Body>
        </Toast>
      ))}
    </div>
  );
}
