import styled from 'styled-components';

type AccentButtonProps = {
  disabled?: boolean;
  onClick?: (...a: any[]) => void;
};

const AccentButtonBase = styled.button<AccentButtonProps>`
  height: 40px;
  padding: 0 15px;
  line-height: 40px;
  min-width: 100px;
  text-align: center;
  outline: none;
  font-size: 14px;
  font-weight: 600;
  border-radius: 10px;
  color: var(--ui-accent);
  border: 1px solid var(--ui-accent);
  display: inline-block;
  box-sizing: border-box;
  pointer-events: ${(props) => (props.disabled ? 'none' : 'auto')};
  cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};

  &:hover {
    border: 1px solid var(--ui-accent);
  }
`;
export const AccentButton = styled(AccentButtonBase)`
  background-color: ${(props) =>
    props.disabled ? 'var(--bg_control-disabled)' : 'var(--bg_outside-accent)'};
  color: ${(props) =>
    props.disabled ? 'var(--bg_control)' : 'var(--ui-accent)'};
  border-color: ${(props) =>
    props.disabled ? 'var(--bg_control)' : 'var(--ui-accent)'};

  &:hover {
    filter: brightness(0.7);
  }
`;
export const AccentButtonLarge = styled(AccentButton)`
  font-size: 16px;
  line-height: 60px;
  height: 60px;
`;

export const PrimaryAccentButton = styled(AccentButtonBase)`
  color: ${(props) =>
    props.disabled ? 'var(--bg_control)' : 'var(--ui-accent-ink)'};
  border-color: ${(props) =>
    props.disabled ? 'var(--bg_control)' : 'var(--ui-accent)'};
  background-color: ${(props) =>
    props.disabled ? 'transparent' : 'var(--ui-accent)'};
  &:hover {
    filter: brightness(0.7);
  }
`;
