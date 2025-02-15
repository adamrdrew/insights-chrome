import React, { useEffect, useRef, useState } from 'react';
import { Backdrop } from '@patternfly/react-core/dist/dynamic/components/Backdrop';
import { Bullseye } from '@patternfly/react-core/dist/dynamic/layouts/Bullseye';
import { MenuToggle } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';
import { Panel, PanelMain } from '@patternfly/react-core/dist/dynamic/components/Panel';
import { Popper } from '@patternfly/react-core/dist/dynamic/helpers/Popper/Popper';
import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner';

import './AllServicesDropdown.scss';
import AllServicesPortal from './AllServicesMenu';
import { useLocation } from 'react-router-dom';
import useAllServices from '../../hooks/useAllServices';
import useFavoritedServices from '../../hooks/useFavoritedServices';

export type ServicesNewNavProps = {
  Footer?: React.ReactNode;
};

const AllServicesDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();
  const { linkSections, ready } = useAllServices();
  const favoritedServices = useFavoritedServices();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const handleMenuKeys = (event: KeyboardEvent) => {
    if (!isOpen) {
      return;
    }
    if (menuRef.current?.contains(event.target as Node) || toggleRef.current?.contains(event.target as Node)) {
      if (event.key === 'Escape' || event.key === 'Tab') {
        setIsOpen((prev) => !prev);
        toggleRef.current?.focus();
      }
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (isOpen && !menuRef.current?.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  React.useEffect(() => {
    window.addEventListener('keydown', handleMenuKeys);
    window.addEventListener('click', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleMenuKeys);
      window.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen, menuRef]);

  const onToggleClick = (ev: React.MouseEvent) => {
    ev.stopPropagation();
    setIsOpen(!isOpen);
  };

  const toggle = (
    <MenuToggle
      className="pf-v5-u-h-100 chr-c-link-service-toggle pf-v5-u-pl-lg pf-v5-u-pr-lg"
      ref={toggleRef}
      onClick={onToggleClick}
      isExpanded={isOpen}
    >
      Services
    </MenuToggle>
  );

  return (
    <Popper
      trigger={toggle}
      appendTo={document.body}
      isVisible={isOpen}
      popper={
        <>
          {ready ? (
            <AllServicesPortal
              favoritedServices={favoritedServices}
              linkSections={linkSections}
              menuRef={menuRef}
              setIsOpen={setIsOpen}
              isOpen={isOpen}
            />
          ) : (
            <div ref={menuRef} className="pf-v5-c-dropdown chr-c-page__services-nav-dropdown-menu" data-testid="chr-c__find-app-service">
              <Backdrop>
                <Panel variant="raised" className="pf-v5-c-dropdown__menu pf-v5-u-p-0 pf-v5-u-w-100 chr-c-panel-services-nav ">
                  <PanelMain>
                    <Bullseye>
                      <Spinner />
                    </Bullseye>
                  </PanelMain>
                </Panel>
              </Backdrop>
            </div>
          )}
        </>
      }
    />
  );
};

export default AllServicesDropdown;
