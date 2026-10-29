import {useMemo} from 'react';
import {useDispatch} from 'react-redux';
import {useAppSelector} from 'src/store/hooks';
import {
  getNumberOfLayers,
  getSelectedLayerIndex,
  setLayer,
} from 'src/store/keymapSlice';
import styled from 'styled-components';
import {useTranslation} from 'react-i18next';

const Container = styled.div`
  position: absolute;
  left: 20px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 400;
  top: 12px;
`;
const Label = styled.label`
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color_label-highlighted);
  margin-right: 6px;
`;
const LayerButton = styled.button<{$selected?: boolean}>`
  outline: none;
  font-variant-numeric: tabular-nums;
  border: 1px solid var(--border_color_cell);
  border-radius: 8px;
  min-width: 30px;
  min-height: 30px;
  background: ${(props) =>
    props.$selected ? 'var(--ui-accent)' : 'transparent'};
  color: ${(props) =>
    props.$selected
      ? 'var(--ui-accent-ink)'
      : 'var(--color_label-highlighted)'};
  cursor: pointer;
  font-size: 12px;
  font-weight: 400;
  &:hover {
    border: none;
    background: ${(props) => (props.$selected ? 'auto' : 'var(--bg_menu)')};
    color: ${(props) =>
      props.$selected ? 'auto' : 'var(--color_label-highlighted)'};
  }
`;

export const LayerControl = () => {
  const {t} = useTranslation();
  const dispatch = useDispatch();
  const numberOfLayers = useAppSelector(getNumberOfLayers);
  const selectedLayerIndex = useAppSelector(getSelectedLayerIndex);

  const Layers = useMemo(
    () =>
      new Array(numberOfLayers)
        .fill(0)
        .map((_, idx) => idx)
        .map((layerLabel) => (
          <LayerButton
            key={layerLabel}
            $selected={layerLabel === selectedLayerIndex}
            onClick={() => dispatch(setLayer(layerLabel))}
          >
            {layerLabel}
          </LayerButton>
        )),
    [numberOfLayers, selectedLayerIndex],
  );

  return (
    <Container>
      <Label>{t('Layer')}</Label>
      {Layers}
    </Container>
  );
};
