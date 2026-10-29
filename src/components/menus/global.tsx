import React, {useMemo} from 'react';
import styled from 'styled-components';
import {Link, useLocation} from 'wouter';
import PANES from '../../utils/pane-config';
import {useAppSelector} from 'src/store/hooks';
import {getShowConsoleTab, getShowDesignTab} from 'src/store/settingsSlice';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {ErrorLink, ErrorsPaneConfig} from '../panes/errors';
import {ExternalLinks} from './external-links';
import {useTranslation} from 'react-i18next';
import {LanguageSelect} from './language-select';

const Container = styled.div`
  width: 100%;
  height: 50px;
  flex-shrink: 0;
  box-sizing: border-box;
  padding: 0 20px;
  border-bottom: 1px solid var(--border_color_cell);
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
  z-index: 10;
`;
const Brand = styled.div`
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.04em;
  color: var(--color_label-highlighted);
  margin-right: 24px;
  white-space: nowrap;
  span {
    color: var(--ui-accent);
  }
  @media (max-width: 800px) {
    margin-right: 4px;
    font-size: 14px;
  }
`;
const NavItem = styled.span<{$selected: boolean}>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 8px;
  background: ${(p) => (p.$selected ? 'var(--ui-accent-soft)' : 'transparent')};
  color: ${(p) => (p.$selected ? 'var(--ui-accent)' : 'var(--color_label)')};
  @media (max-width: 850px) {
    padding: 8px;
    span {
      display: none;
    }
  }
`;

const {DEBUG_PROD, MODE, DEV} = import.meta.env;
const showDebugPane = MODE === 'development' || DEBUG_PROD === 'true' || DEV;

const GlobalContainer = styled(Container)`
  background: var(--bg_outside-accent);
  column-gap: 6px;
`;

export const UnconnectedGlobalMenu = () => {
  const {t, i18n} = useTranslation();
  const showDesignTab = useAppSelector(getShowDesignTab);
  const showConsoleTab = useAppSelector(getShowConsoleTab);

  const [location] = useLocation();

  const Panes = useMemo(() => {
    return PANES.filter((pane) => pane.key !== ErrorsPaneConfig.key).map(
      (pane) => {
        if (pane.key === 'design' && !showDesignTab) return null;
        if (pane.key === 'console' && !showConsoleTab) return null;
        if (pane.key === 'debug' && !showDebugPane) return null;
        return (
          <Link key={pane.key} to={pane.path}>
            <a
              aria-label={t(pane.title)}
              aria-current={pane.path === location ? 'page' : undefined}
            >
              <NavItem $selected={pane.path === location} title={t(pane.title)}>
                <FontAwesomeIcon size={'xl'} icon={pane.icon} />
                <span>{t(pane.title)}</span>
              </NavItem>
            </a>
          </Link>
        );
      },
    );
  }, [location, showConsoleTab, showDesignTab]);

  return (
    <React.Fragment>
      <GlobalContainer>
        <Brand>
          <span>⌘</span> Keyspace
        </Brand>
        <ErrorLink />
        {Panes}
        <div style={{flex: 1}} />
        <LanguageSelect />
        <ExternalLinks />
      </GlobalContainer>
    </React.Fragment>
  );
};
