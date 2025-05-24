import React from "react";
import { Button, Space } from "antd";
import { LeftOutlined, RightOutlined, StepBackwardOutlined, StepForwardOutlined } from "@ant-design/icons";

interface ControlsProps {
  onFirst: () => void;
  onPrev: () => void;
  onNext: () => void;
  onLast: () => void;
  canPrev: boolean;
  canNext: boolean;
}

const Controls: React.FC<ControlsProps> = ({ onFirst, onPrev, onNext, onLast, canPrev, canNext }) => (
  <Space>
    <Button icon={<StepBackwardOutlined />} onClick={onFirst} disabled={!canPrev} />
    <Button icon={<LeftOutlined />} onClick={onPrev} disabled={!canPrev} />
    <Button icon={<RightOutlined />} onClick={onNext} disabled={!canNext} />
    <Button icon={<StepForwardOutlined />} onClick={onLast} disabled={!canNext} />
  </Space>
);

export default Controls; 