import { cloneElement, ReactElement, useRef, useState } from "react";
import { Dialog as DialogHUI } from "@headlessui/react";
import Button from "./button";

export enum DialogSize {
  small = "max-w-sm",
  medium = "max-w-lg",
  large = "max-w-2xl",
}

interface DialogProps {
  children: ReactElement;
  title: string;
  openTrigger: ReactElement;
  confirm: { label: string; callback?: () => void };
  cancel: { label: string; callback?: () => void };
  dialogSize?: DialogSize;
  closeWithEscOrPressOutside?: boolean;
}

function Dialog({
  children,
  title,
  openTrigger,
  confirm,
  cancel,
  dialogSize = DialogSize.small,
  closeWithEscOrPressOutside = true,
}: DialogProps) {
  let [isOpen, setIsOpen] = useState(false);

  const handleConfirm = () => {
    setIsOpen(false);
    confirm?.callback && confirm.callback();
  };

  const handleCancel = () => {
    setIsOpen(false);
    cancel?.callback && cancel.callback();
  };

  const handleClose = () => {
    if (closeWithEscOrPressOutside) {
      setIsOpen(false);
    }
  };

  const initFocusRef = useRef(null);

  return (
    <>
      {cloneElement(openTrigger, { onPress: () => setIsOpen(true) })}
      <DialogHUI
        open={isOpen}
        onClose={handleClose}
        initialFocus={initFocusRef}
      >
        {/* The backdrop, rendered as a fixed sibling to the panel container */}
        <div
          className="fixed inset-0 bg-neutral-900 bg-opacity-25"
          aria-hidden="true"
        />

        {/* Full-screen container to center the panel */}
        <div className="fixed inset-0 overflow-y-auto p-10">
          <DialogHUI.Panel
            ref={initFocusRef}
            className={`mx-auto max-w-sm rounded-lg bg-white py-10 px-8 shadow-lg ${dialogSize}`}
          >
            <DialogHUI.Title as="h4">{title}</DialogHUI.Title>
            <DialogHUI.Description className="mt-8" as="div">
              {children}
            </DialogHUI.Description>
            <div className="mt-10 flex flex-wrap justify-end gap-4">
              <Button variant="secondary" onPress={handleCancel}>
                {cancel.label}
              </Button>
              <Button onPress={handleConfirm}>{confirm.label}</Button>
            </div>
          </DialogHUI.Panel>
        </div>
      </DialogHUI>
    </>
  );
}

export default Dialog;