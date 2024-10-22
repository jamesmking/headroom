"use client";
import { Modal } from "@/app/ui";
import { TaskFormAdd } from "@/app/components";
import React, { useCallback } from "react";

export const ModalWrap = () => {
  const [triggerClose, setTriggerClose] = React.useState(false);

  const handleTriggerClose = () => {
    console.log("handleTriggerClose");
    if (!triggerClose) {
      setTriggerClose(true);
    }
  };

  const resetTrigger = useCallback(() => {
    console.log("resetTrigger");
    if (triggerClose) {
      setTriggerClose(false);
    }
  }, [triggerClose]);

  return (
    <div>
      <Modal triggerClose={triggerClose} resetTrigger={resetTrigger}>
        <TaskFormAdd onSuccess={handleTriggerClose} />
      </Modal>
    </div>
  );
};
