import React, { Fragment } from 'react';
import { Backdrop } from '@patternfly/react-core/dist/dynamic/components/Backdrop';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Card, CardBody, CardHeader } from '@patternfly/react-core/dist/dynamic/components/Card';
import { Stack, StackItem } from '@patternfly/react-core/dist/dynamic/layouts/Stack';
import { Panel, PanelMain } from '@patternfly/react-core/dist/dynamic/components/Panel';
import { Sidebar, SidebarContent, SidebarPanel } from '@patternfly/react-core/dist/dynamic/components/Sidebar';
import { TabContent } from '@patternfly/react-core/dist/dynamic/components/Tabs';
import { Text, TextContent, TextVariants } from '@patternfly/react-core/dist/dynamic/components/Text';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';

import ChromeLink from '../ChromeLink';
import TimesIcon from '@patternfly/react-icons/dist/dynamic/icons/times-icon';
import type { AllServicesSection } from '../AllServices/allServicesLinks';
import FavoriteServicesGallery from '../FavoriteServices/ServicesGallery';
import AllServicesTabs from './AllServicesTabs';
import AllServicesGallery from './AllServicesGallery';
import { ServiceTileProps } from '../FavoriteServices/ServiceTile';
import QuickAccess from '../FavoriteServices/QuickAccess';
import { AllServicesDropdownContext } from './common';

export type AllServicesMenuProps = {
  setIsOpen: (isOpen: boolean) => void;
  isOpen: boolean;
  menuRef: React.RefObject<HTMLDivElement>;
  linkSections: AllServicesSection[];
  favoritedServices: ServiceTileProps[];
};

const TAB_CONTENT_ID = 'refTab1Section';
const FAVORITE_TAB_ID = 'favorites';

const AllServicesMenu = ({ setIsOpen, isOpen, menuRef, linkSections, favoritedServices }: AllServicesMenuProps) => {
  const [activeTabKey, setActiveTabKey] = React.useState<string | number>(FAVORITE_TAB_ID);
  const [isExpanded, setIsExpanded] = React.useState<boolean>(false);
  const [selectedService, setSelectedService] = React.useState<AllServicesSection>(linkSections[0]);

  // Toggle currently active tab
  const handleTabClick = (event: React.MouseEvent<any> | React.KeyboardEvent | MouseEvent, tabIndex: string | number) => {
    setActiveTabKey(tabIndex);
  };

  const onTabClick = (section: AllServicesSection, index: number) => {
    setSelectedService(section);
    setActiveTabKey(index);
  };

  const onToggle = (_e: React.MouseEvent<any>, isExpanded: boolean) => {
    setIsExpanded(isExpanded);
  };

  const tabContentRef = React.createRef<HTMLElement>();

  return (
    <AllServicesDropdownContext.Provider
      value={{
        onLinkClick() {
          // close modal on any link click
          setIsOpen(false);
        },
      }}
    >
      <div ref={menuRef} className="pf-v5-u-w-100 chr-c-page__services-nav-dropdown-menu" data-testid="chr-c__find-app-service">
        <Backdrop>
          <Panel variant="raised" className="pf-v5-u-p-0 chr-c-panel-services-nav">
            <PanelMain>
              <Sidebar>
                <SidebarPanel>
                  <Stack>
                    <StackItem className="chr-l-stack__item-browse-all-services pf-v5-u-w-100 pf-v5-u-p-md">
                      <TextContent className="pf-v5-u-text-align-center-on-md pf-v5-u-pl-sm pf-v5-u-pl-0-on-md">
                        <Text component={TextVariants.p}>
                          <ChromeLink href="/allservices">
                            <Button isBlock>All services</Button>
                          </ChromeLink>
                        </Text>
                      </TextContent>
                    </StackItem>
                    <StackItem className="pf-v5-u-w-100">
                      <AllServicesTabs
                        activeTabKey={activeTabKey}
                        handleTabClick={handleTabClick}
                        isExpanded={isExpanded}
                        onToggle={onToggle}
                        linkSections={linkSections}
                        tabContentRef={tabContentRef}
                        onTabClick={onTabClick}
                        activeTabTitle={activeTabKey === FAVORITE_TAB_ID ? 'Favorites' : selectedService.title}
                      />
                    </StackItem>
                  </Stack>
                </SidebarPanel>
                <SidebarContent>
                  <Card isPlain>
                    <CardHeader
                      actions={{
                        actions: [
                          <Button key="close" variant="plain" aria-label="Close menu" onClick={() => setIsOpen(!isOpen)}>
                            <TimesIcon />
                          </Button>,
                        ],
                      }}
                      className="pf-v5-u-pr-xs pf-v5-u-pr-md-on-md"
                    >
                      <Title headingLevel="h2">{activeTabKey === FAVORITE_TAB_ID ? 'Favorites' : selectedService.title}</Title>
                    </CardHeader>
                    <CardBody>
                      <TabContent eventKey={activeTabKey} id={TAB_CONTENT_ID} ref={tabContentRef} aria-label={selectedService.description}>
                        {activeTabKey === FAVORITE_TAB_ID ? (
                          <Fragment>
                            <QuickAccess />
                            <FavoriteServicesGallery favoritedServices={favoritedServices} />
                          </Fragment>
                        ) : (
                          <AllServicesGallery selectedService={selectedService} />
                        )}
                      </TabContent>
                    </CardBody>
                  </Card>
                </SidebarContent>
              </Sidebar>
            </PanelMain>
          </Panel>
        </Backdrop>
      </div>
    </AllServicesDropdownContext.Provider>
  );
};

export default AllServicesMenu;
