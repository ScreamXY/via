import {useMemo, useState} from 'react';
import styled from 'styled-components';
import {AccentButton, PrimaryAccentButton} from './accent-button';
import {AutocompleteItem} from './autocomplete-keycode';
import {anyKeycodeToString} from '../../utils/advanced-keys';
import {useCombobox} from 'downshift';
import TextInput from './text-input';
import {getKeycodesForKeyboard} from '../../utils/key';
import {
  getCustomKeycodes,
  searchKeycodes,
  resolveKeycodeInput,
  withKeycodeAliases,
} from '../../utils/keycode-search';
import {useAppSelector} from 'src/store/hooks';
import {
  getBasicKeyToByte,
  getSelectedDefinition,
} from 'src/store/definitionsSlice';
import {getSelectedConnectedDevice} from 'src/store/devicesSlice';
import {
  ModalBackground,
  ModalContainer,
  PromptText,
  RowDiv,
} from './dialog-base';
import {useTranslation} from 'react-i18next';

const AutocompleteContainer = styled.ul`
  position: relative;
  background-color: var(--bg_menu);
  max-height: min(320px, 40vh);
  border-radius: 12px;
  overflow: auto;
  border: 1px solid var(--bg_control);
  margin: 0;
  padding: 0;
  width: 100%;
  box-sizing: border-box;
  margin-top: 0;
  line-height: normal;
`;

const AutocompleteItemRow = styled.li`
  &:not(:last-child) {
    border-bottom: 1px solid var(--bg_control);
  }
`;

type KeycodeModalProps = {
  defaultValue?: number;
  onChange?: (val: number) => void;
  onExit: () => void;
  onConfirm: (keycode: number) => void;
};

const maxSuggestions = 40;

// Connect component with redux here:
export const KeycodeModal: React.FC<KeycodeModalProps> = (props) => {
  const {t} = useTranslation();
  const selectedDefinition = useAppSelector(getSelectedDefinition);
  const selectedDevice = useAppSelector(getSelectedConnectedDevice);
  const {basicKeyToByte, byteToKey} = useAppSelector(getBasicKeyToByte);
  const supportedInputItems = useMemo(
    () =>
      withKeycodeAliases(
        selectedDefinition && selectedDevice
          ? [
              ...getKeycodesForKeyboard(
                selectedDefinition,
                selectedDevice.protocol,
              ),
              ...getCustomKeycodes(selectedDefinition),
            ]
          : [],
        basicKeyToByte,
      ),
    [selectedDefinition, selectedDevice, basicKeyToByte],
  );
  const [query, setQuery] = useState('');
  const inputItems = searchKeycodes(supportedInputItems, query)
    .filter(
      (item) => resolveKeycodeInput(item.code, basicKeyToByte, []) !== null,
    )
    .slice(0, maxSuggestions)
    .map((item) => ({
      ...item,
      label: item.title ? `${item.name} — ${item.title}` : item.name,
    }));
  const defaultInput = anyKeycodeToString(
    props.defaultValue as number,
    basicKeyToByte,
    byteToKey,
  );

  const {
    getMenuProps,
    getInputProps,
    highlightedIndex,
    inputValue,
    getItemProps,
    isOpen,
  } = useCombobox({
    items: inputItems,
    initialIsOpen: defaultInput === '',
    defaultInputValue: defaultInput,
    itemToString: (item) => item?.code ?? '',
    onInputValueChange: ({inputValue}) => {
      setQuery(inputValue ?? '');
    },
  });

  const resolved = resolveKeycodeInput(
    inputValue,
    basicKeyToByte,
    supportedInputItems,
  );
  if (!selectedDefinition || !selectedDevice) {
    return null;
  }
  return (
    <ModalBackground>
      <ModalContainer
        role="dialog"
        aria-label="Choose a keycode"
        aria-modal="true"
      >
        <PromptText>Choose a command</PromptText>
        <div style={{width: 'min(640px, calc(100vw - 100px))'}}>
          <div>
            <TextInput
              {...getInputProps({'aria-label': 'Keycode, name or alias'})}
              type="text"
              placeholder="Search: hyper, meh, command, screenshot, KC_A…"
              style={{width: '100%', marginBottom: 8}}
            />
          </div>
          <AutocompleteContainer
            {...getMenuProps()}
            style={{
              display: isOpen && inputItems.length ? 'block' : 'none',
            }}
          >
            {isOpen &&
              inputItems.map((item, index) => (
                <AutocompleteItemRow
                  {...getItemProps({item, index})}
                  key={item.code}
                >
                  <AutocompleteItem
                    selected={highlightedIndex === index}
                    entity={item}
                    key={item.code}
                  />
                </AutocompleteItemRow>
              ))}
          </AutocompleteContainer>
        </div>
        <div
          style={{color: 'var(--color_label)', maxWidth: 640}}
          aria-live="polite"
        >
          {resolved
            ? `Selected: ${resolved.code} · 0x${resolved.value
                .toString(16)
                .padStart(4, '0')}`
            : 'Type a name, alias, QMK expression or hex code; choose a suggestion with ↑/↓ and Enter.'}
          {query && inputItems.length === 0 && !resolved && (
            <div>No matching keycodes.</div>
          )}
        </div>
        <RowDiv>
          <AccentButton onClick={props.onExit}>{t('Cancel')}</AccentButton>
          <PrimaryAccentButton
            disabled={!resolved}
            onClick={() => {
              if (resolved) {
                props.onConfirm(resolved.value);
              }
            }}
          >
            {t('Confirm')}
          </PrimaryAccentButton>
        </RowDiv>
      </ModalContainer>
    </ModalBackground>
  );
};
