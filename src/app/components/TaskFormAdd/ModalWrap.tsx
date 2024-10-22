"use client";
import { Modal } from "@/app/ui";
import { TaskFormAdd } from "@/app/components";
import React from "react";

export const ModalWrap = () => {
  const [triggerClose, setTriggerClose] = React.useState(false);

  const handleTriggerClose = () => setTriggerClose(true);
  const resetTrigger = () => setTriggerClose(false);

  return (
    <div>
      <Modal triggerClose={triggerClose} resetTrigger={resetTrigger}>
        <TaskFormAdd onSuccess={handleTriggerClose} />
      </Modal>
    </div>
  );
};
