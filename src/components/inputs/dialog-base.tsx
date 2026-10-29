import styled from 'styled-components';

export const ModalBackground = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  background: rgba(4, 12, 12, 0.7);
  backdrop-filter: blur(8px);
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 30;
`;

export const ModalContainer = styled.div`
  border: 1px solid var(--border_color_icon);
  box-shadow: 0 24px 100px #0008;
  min-width: min(460px, calc(100vw - 32px));
  max-height: calc(100dvh - 32px);
  overflow-y: auto;
  width: max-content;
  max-width: calc(100vw - 40px);
  min-height: 170px;
  gap: 20px;
  background-color: var(--bg_menu);
  border-radius: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  padding: 28px;
  box-sizing: border-box;
`;

export const PromptText = styled.div`
  font-weight: 500;
  user-select: none;
  color: var(--color_label-highlighted);
  font-size: 18px;
  line-height: 1.4;
  max-width: calc(100vw - 80px);
  white-space: pre-line;
  text-align: center;
`;

export const RowDiv = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 220px;
  gap: 20px;
`;
