import TextInput from '../../inputs/text-input';
import {
  searchKeycodes,
  withKeycodeAliases,
} from '../../../utils/keycode-search';
import {FC, useState, useEffect, useMemo} from 'react';
import styled from 'styled-components';
import {Button} from '../../inputs/button';
import {KeycodeModal} from '../../inputs/custom-keycode-modal';
import {title, component} from '../../icons/keyboard';
import * as EncoderPane from './encoder';
import {
  keycodeInMaster,
  getByteForCode,
  getKeycodes,
  getOtherMenu,
  IKeycode,
  IKeycodeMenu,
  categoriesForKeycodeModule,
  getQMKLightingKeycodes,
} from '../../../utils/key';
import {ErrorMessage} from '../../styled';
import {
  KeycodeType,
  getLightingDefinition,
  isVIADefinitionV3,
  isVIADefinitionV2,
  VIADefinitionV3,
} from '@the-via/reader';
import {OverflowCell, SubmenuOverflowCell, SubmenuRow} from '../grid';
import {useAppDispatch, useAppSelector} from 'src/store/hooks';
import {
  getBasicKeyToByte,
  getSelectedDefinition,
  getSelectedKeyDefinitions,
} from 'src/store/definitionsSlice';
import {getSelectedConnectedDevice} from 'src/store/devicesSlice';
import {
  getSelectedKey,
  getSelectedKeymap,
  updateKey as updateKeyAction,
  updateSelectedKey,
} from 'src/store/keymapSlice';
import {getMacroCount} from 'src/store/macrosSlice';
import {
  disableGlobalHotKeys,
  enableGlobalHotKeys,
  getDisableFastRemap,
  getHostKeyboardLayout,
} from 'src/store/settingsSlice';
import {keymapExtras} from 'src/utils/keymap-extras';
import {getNextKey} from 'src/utils/keyboard-rendering';
import {useTranslation} from 'react-i18next';
const KeycodeList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(185px, 100%), 1fr));
  gap: 10px;
  align-items: stretch;
`;
const MenuContainer = styled.div`
  padding: 22px 10px;
  &::before {
    content: 'LIBRARY';
    display: block;
    padding: 0 12px 16px;
    font-size: 10px;
    letter-spacing: 0.14em;
    color: var(--color_label);
    font-weight: 700;
  }
`;
const Keycode = styled.button<{disabled: boolean}>`
  width: 100%;
  min-width: 0;
  min-height: 88px;
  height: auto;
  padding: 15px;
  margin: 0;
  text-align: left;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 7px;
  border: 1px solid var(--border_color_cell);
  border-radius: 12px;
  background: var(--ui-surface);
  color: var(--color_label-highlighted);
  cursor: pointer;
  white-space: normal;
  overflow-wrap: anywhere;
  transition:
    background 0.15s,
    border-color 0.15s;
  &:hover:not(:disabled) {
    background: var(--ui-raised);
    border-color: var(--ui-accent);
  }
  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;
const KeycodeContent = styled.span`
  font-size: 14px;
  font-weight: 600;
  line-height: 1.45;
  width: 100%;
  white-space: normal;
  overflow-wrap: anywhere;
`;
const KeycodeCode = styled.code`
  font:
    11px/1.5 ui-monospace,
    SFMono-Regular,
    Menlo,
    monospace;
  color: var(--ui-accent);
  overflow-wrap: anywhere;
  white-space: normal;
`;
const KeycodeHint = styled.span`
  font-size: 12px;
  line-height: 1.5;
  color: var(--color_label);
  overflow-wrap: anywhere;
`;
const CustomKeycode = styled.button`
  padding: 12px 18px;
  min-height: 44px;
  border-radius: 10px;
  border: 1px solid var(--ui-accent);
  background: var(--ui-accent-soft);
  color: var(--ui-accent);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  &:hover {
    filter: brightness(1.15);
  }
`;
const KeycodeContainer = styled.div`
  padding: 24px 28px 40px;
  max-width: 1800px;
  margin: 0 auto;
  @media (max-width: 800px) {
    padding: 16px;
  }
`;
const LibraryHeading = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  h2 {
    font-size: 22px;
    font-weight: 650;
    color: var(--color_label-highlighted);
    letter-spacing: -0.04em;
    margin: 0 0 6px;
  }
  p {
    margin: 0;
    font-size: 13px;
    line-height: 1.5;
    color: var(--color_label);
  }
`;
const generateKeycodeCategories = (
  basicKeyToByte: Record<string, number>,
  numMacros: number = 16,
) => getKeycodes(numMacros).concat(getOtherMenu(basicKeyToByte));

const maybeFilter = <M extends Function>(maybe: boolean, filter: M) =>
  maybe ? () => true : filter;

export const Pane: FC = () => {
  const selectedKey = useAppSelector(getSelectedKey);
  const dispatch = useAppDispatch();
  const keys = useAppSelector(getSelectedKeyDefinitions);
  useEffect(
    () => () => {
      dispatch(updateSelectedKey(null));
    },
    [],
  ); // componentWillUnmount equiv

  if (selectedKey !== null && keys[selectedKey].ei !== undefined) {
    return <EncoderPane.Pane />;
  }
  return <KeycodePane />;
};

export const KeycodePane: FC = () => {
  const {t} = useTranslation();
  const dispatch = useAppDispatch();
  const macros = useAppSelector((state: any) => state.macros);
  const selectedDefinition = useAppSelector(getSelectedDefinition);
  const selectedDevice = useAppSelector(getSelectedConnectedDevice);
  const matrixKeycodes = useAppSelector(getSelectedKeymap);
  const selectedKey = useAppSelector(getSelectedKey);
  const disableFastRemap = useAppSelector(getDisableFastRemap);
  const selectedKeyDefinitions = useAppSelector(getSelectedKeyDefinitions);
  const {basicKeyToByte} = useAppSelector(getBasicKeyToByte);
  const macroCount = useAppSelector(getMacroCount);
  const hostKeyboardLayout = useAppSelector(getHostKeyboardLayout);
  const keycodeLUT = keymapExtras[hostKeyboardLayout]?.keycodeLUT;

  const KeycodeCategories = useMemo(
    () =>
      generateKeycodeCategories(basicKeyToByte, macroCount).map((category) =>
        category.id === 'qmk_lighting' && selectedDefinition && selectedDevice
          ? {
              ...category,
              keycodes: getQMKLightingKeycodes(
                selectedDefinition,
                selectedDevice.protocol,
              ),
            }
          : category,
      ),
    [basicKeyToByte, macroCount, selectedDefinition, selectedDevice],
  );

  const [selectedCategory, setSelectedCategory] = useState(
    KeycodeCategories[0].id,
  );
  const [showKeyTextInputModal, setShowKeyTextInputModal] = useState(false);
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  useEffect(() => {
    dispatch(
      searchFocused || showKeyTextInputModal
        ? disableGlobalHotKeys()
        : enableGlobalHotKeys(),
    );
    return () => {
      dispatch(enableGlobalHotKeys());
    };
  }, [dispatch, searchFocused, showKeyTextInputModal]);
  if (!selectedDefinition || !selectedDevice || !matrixKeycodes) {
    return null;
  }

  const getEnabledMenus = (): IKeycodeMenu[] => {
    if (isVIADefinitionV3(selectedDefinition)) {
      return getEnabledMenusV3(selectedDefinition);
    }
    const {lighting, customKeycodes} = selectedDefinition;
    const {keycodes} = getLightingDefinition(lighting);
    return KeycodeCategories.filter(
      maybeFilter(
        keycodes === KeycodeType.QMK,
        ({id}) => id !== 'qmk_lighting',
      ),
    )
      .filter(
        maybeFilter(keycodes === KeycodeType.WT, ({id}) => id !== 'lighting'),
      )
      .filter(
        maybeFilter(
          typeof customKeycodes !== 'undefined',
          ({id}) => id !== 'custom',
        ),
      );
  };
  const getEnabledMenusV3 = (definition: VIADefinitionV3): IKeycodeMenu[] => {
    const keycodes = ['default' as const, ...(definition.keycodes || [])];
    const allowedKeycodes = keycodes.flatMap((keycodeName) =>
      categoriesForKeycodeModule(keycodeName),
    );
    if ((selectedDefinition.customKeycodes || []).length !== 0) {
      allowedKeycodes.push('custom');
    }
    return KeycodeCategories.filter((category) =>
      allowedKeycodes.includes(category.id),
    );
  };

  const renderMacroError = () => {
    return (
      <ErrorMessage>
        {t(
          'Your current firmware does not support macros. Install the latest firmware for your device.',
        )}
      </ErrorMessage>
    );
  };

  const renderCategories = () => {
    return (
      <MenuContainer>
        {getEnabledMenus().map(({id, label}) => (
          <SubmenuRow
            as="button"
            style={{width: '100%', textAlign: 'left', fontFamily: 'inherit'}}
            $selected={id === selectedCategory}
            onClick={() => {
              setSelectedCategory(id);
              setSearch('');
            }}
            key={id}
          >
            {t(label)}
          </SubmenuRow>
        ))}
      </MenuContainer>
    );
  };

  const renderKeyInputModal = () => {
    return (
      <KeycodeModal
        defaultValue={
          selectedKey !== null ? matrixKeycodes[selectedKey] : undefined
        }
        onExit={() => {
          dispatch(enableGlobalHotKeys());
          setShowKeyTextInputModal(false);
        }}
        onConfirm={(keycode) => {
          dispatch(enableGlobalHotKeys());
          updateKey(keycode);
          setShowKeyTextInputModal(false);
        }}
      />
    );
  };

  const updateKey = (value: number) => {
    if (selectedKey !== null) {
      dispatch(updateKeyAction(selectedKey, value));
      dispatch(
        updateSelectedKey(
          disableFastRemap || !selectedKeyDefinitions
            ? null
            : getNextKey(selectedKey, selectedKeyDefinitions),
        ),
      );
    }
  };

  const handleClick = (code: string, i: number) => {
    if (code == 'text') {
      setShowKeyTextInputModal(true);
    } else {
      return (
        keycodeInMaster(code, basicKeyToByte) &&
        updateKey(getByteForCode(code, basicKeyToByte))
      );
    }
  };

  const renderKeycode = (keycode: IKeycode, index: number) => {
    const {code} = keycode;
    const lutEntry = keycodeLUT && code ? keycodeLUT[code] : undefined;
    const name = lutEntry ? lutEntry.name : keycode.name;
    const title = lutEntry?.title ?? keycode.title;
    return (
      <Keycode
        as="button"
        key={code}
        title={`${name} — ${code}${title ? `: ${title}` : ''}`}
        aria-label={`${name}: ${code}`}
        disabled={!keycodeInMaster(code, basicKeyToByte) && code != 'text'}
        onClick={() => handleClick(code, index)}
      >
        <KeycodeContent>{name || 'No action'}</KeycodeContent>
        <KeycodeCode>{code}</KeycodeCode>
        {title && title !== name && <KeycodeHint>{title}</KeycodeHint>}
      </Keycode>
    );
  };

  const renderCustomKeycode = () => {
    return (
      <CustomKeycode
        as="button"
        key="customKeycode"
        onClick={() => selectedKey !== null && handleClick('text', 0)}
      >
        + Custom keycode
      </CustomKeycode>
    );
  };

  const renderSelectedCategory = (
    keycodes: IKeycode[],
    selectedCategory: string,
  ) => {
    const keycodeListItems = keycodes.map((keycode, i) =>
      renderKeycode(keycode, i),
    );
    switch (selectedCategory) {
      case 'macro': {
        return !macros.isFeatureSupported ? (
          renderMacroError()
        ) : (
          <KeycodeList>{keycodeListItems}</KeycodeList>
        );
      }
      case 'special': {
        return <KeycodeList>{keycodeListItems}</KeycodeList>;
      }
      case 'custom': {
        if (
          (!isVIADefinitionV2(selectedDefinition) &&
            !isVIADefinitionV3(selectedDefinition)) ||
          !selectedDefinition.customKeycodes
        ) {
          return null;
        }
        return (
          <KeycodeList>
            {selectedDefinition.customKeycodes.map((keycode, idx) => {
              return renderKeycode(
                {
                  ...keycode,
                  code: `CUSTOM(${idx})`,
                },
                idx,
              );
            })}
          </KeycodeList>
        );
      }
      default: {
        return <KeycodeList>{keycodeListItems}</KeycodeList>;
      }
    }
  };

  const selectedCategoryKeycodes = KeycodeCategories.find(
    ({id}) => id === selectedCategory,
  )?.keycodes as IKeycode[];

  const searchableKeys = withKeycodeAliases(
    getEnabledMenus()
      .filter((menu) => menu.id !== 'macro' || macros.isFeatureSupported)
      .flatMap((menu) =>
        menu.id === 'custom'
          ? (selectedDefinition.customKeycodes || []).map((key, index) => ({
              ...key,
              code: `CUSTOM(${index})`,
            }))
          : menu.keycodes,
      )
      .map((key) => ({
        ...key,
        aliases: [
          ...(key.aliases || []),
          keycodeLUT?.[key.code]?.name || '',
          keycodeLUT?.[key.code]?.title || '',
        ],
      })),
    basicKeyToByte,
  );
  const results = searchKeycodes(searchableKeys, search);
  return (
    <>
      <SubmenuOverflowCell>{renderCategories()}</SubmenuOverflowCell>
      <OverflowCell>
        <KeycodeContainer>
          <LibraryHeading>
            <div>
              <h2>
                {search.trim()
                  ? 'Search results'
                  : KeycodeCategories.find(
                      (category) => category.id === selectedCategory,
                    )?.label || 'Key library'}
              </h2>
              <p>
                {selectedKey === null
                  ? 'Select a key on your keyboard, then choose its action below.'
                  : 'Choose an action to assign to the selected key.'}
              </p>
            </div>
            {renderCustomKeycode()}
          </LibraryHeading>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <TextInput
              type="search"
              aria-label="Search all keycodes"
              placeholder="Search all keys: hyper, meh, cmd, brightness…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setSearch('');
                }
              }}
              style={{flex: 1, minWidth: 160}}
            />
            {search && (
              <Button as="button" onClick={() => setSearch('')}>
                Clear
              </Button>
            )}
          </div>
          {search.trim() ? (
            <>
              <p role="status" style={{color: 'var(--color_label)'}}>
                {results.length
                  ? `${results.length} matching keys across all categories`
                  : 'No matching keys. Try a name, alias or QMK code.'}
              </p>
              <KeycodeList>{results.map(renderKeycode)}</KeycodeList>
            </>
          ) : (
            renderSelectedCategory(selectedCategoryKeycodes, selectedCategory)
          )}
        </KeycodeContainer>
        {showKeyTextInputModal && renderKeyInputModal()}
      </OverflowCell>
    </>
  );
};

export const Icon = component;
export const Title = title;
