import styled from 'styled-components';

const TextInput = styled.input`
  background: var(--ui-canvas);
  border: 1px solid var(--border_color_icon);
  border-radius: 10px;
  color: var(--color_label-highlighted);
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 16px;
  padding: 12px 14px;
  min-width: 0;
  box-sizing: border-box;
  &:focus {
    border-color: var(--ui-accent);
  }
  &::placeholder {
    color: var(--color_label);
    opacity: 1;
  }
`;

export default TextInput;
