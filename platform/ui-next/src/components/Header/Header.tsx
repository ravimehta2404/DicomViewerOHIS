import React, { ReactNode } from 'react';
import classNames from 'classnames';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Icons,
  Button,
  ToolButton,
} from '../';
import { IconPresentationProvider } from '@ohif/ui-next';

import NavBar from '../NavBar';

// Todo: we should move this component to composition and remove props base

interface HeaderProps {
  children?: ReactNode;
  menuOptions: Array<{
    title: string;
    icon?: string;
    onClick: () => void;
  }>;
  isReturnEnabled?: boolean;
  onClickReturnButton?: () => void;
  isSticky?: boolean;
  WhiteLabeling?: {
    createLogoComponentFn?: (
      React: React.ComponentType,
      props: Record<string, unknown>
    ) => ReactNode;
  };
  PatientInfo?: ReactNode;
  Secondary?: ReactNode;
  UndoRedo?: ReactNode;
}

function Header({
  children,
  menuOptions,
  isReturnEnabled = true,
  onClickReturnButton,
  isSticky = false,
  WhiteLabeling,
  PatientInfo,
  UndoRedo,
  Secondary,
  ...props
}: HeaderProps): ReactNode {
  const onClickReturn = () => {
    if (isReturnEnabled && onClickReturnButton) {
      onClickReturnButton();
    }
  };

  return (
    <IconPresentationProvider
      size="large"
      IconContainer={ToolButton}
    >
      <NavBar
        isSticky={isSticky}
        {...props}
      >
        {/* Desktop layout - single row */}
        <div className="hidden md:block">
          <div className="relative flex h-[48px] items-center">
            {/* Left section with logo and return button */}
            <div className="flex flex-shrink-0 items-center">
              <div
                className={classNames(
                  'mr-3 inline-flex items-center',
                  isReturnEnabled && 'cursor-pointer'
                )}
                onClick={onClickReturn}
                data-cy="return-to-work-list"
              >
                {isReturnEnabled && <Icons.ArrowLeft className="text-primary ml-1 h-7 w-7" />}
                <div className="ml-1">
                  {WhiteLabeling?.createLogoComponentFn?.(
                    React as unknown as React.ComponentType,
                    props
                  ) || <Icons.OHIFLogo />}
                </div>
              </div>
            </div>
            {/* Secondary toolbar section */}
            {Secondary && <div className="mr-4 h-8 flex-shrink-0">{Secondary}</div>}
            {/* Main toolbar section - takes available space */}
            <div className="min-w-0 flex-1 px-4">
              <div className="flex items-center justify-center">
                <div className="w-full max-w-none">{children}</div>
              </div>
            </div>
            {/* Right section with controls */}
            <div className="flex flex-shrink-0 select-none items-center">
              {UndoRedo}
              {UndoRedo && PatientInfo && (
                <div className="border-primary-dark mx-1.5 h-[25px] border-r"></div>
              )}
              {PatientInfo}
              {PatientInfo && <div className="border-primary-dark mx-1.5 h-[25px] border-r"></div>}
              <div className="flex-shrink-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-primary hover:bg-primary-dark mt-2 h-full w-full"
                    >
                      <Icons.GearSettings />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {menuOptions
                      .filter(option => option.title !== 'About RADFLARE VIEWER')
                      .map((option, index) => {
                        const IconComponent = option.icon
                          ? Icons[option.icon as keyof typeof Icons]
                          : null;
                        return (
                          <DropdownMenuItem
                            key={index}
                            onSelect={option.onClick}
                            className="flex items-center gap-2 py-2"
                          >
                            {IconComponent && (
                              <span className="flex h-4 w-4 items-center justify-center">
                                <Icons.ByName
                                  name={
                                    typeof IconComponent === 'string' ? IconComponent : 'component'
                                  }
                                />
                              </span>
                            )}
                            <span className="flex-1">{option.title}</span>
                          </DropdownMenuItem>
                        );
                      })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile layout - two rows */}
        <div className="block md:hidden">
          {/* First row - Header with essential controls */}
          <div className="relative flex h-[48px] items-center">
            {/* Left section with logo and return button */}
            <div className="flex flex-shrink-0 items-center">
              <div
                className={classNames(
                  'mr-3 inline-flex items-center',
                  isReturnEnabled && 'cursor-pointer'
                )}
                onClick={onClickReturn}
                data-cy="return-to-work-list"
              >
                {isReturnEnabled && <Icons.ArrowLeft className="text-primary ml-1 h-6 w-6" />}
                <div className="ml-1">
                  {WhiteLabeling?.createLogoComponentFn?.(
                    React as unknown as React.ComponentType,
                    props
                  ) || <Icons.OHIFLogo />}
                </div>
              </div>
            </div>
            {/* Secondary toolbar section - smaller on mobile */}
            {Secondary && <div className="mr-2 h-6 flex-shrink-0 text-sm">{Secondary}</div>}

            {/* Spacer to push right content to the end */}
            <div className="flex-1"></div>

            {/* Right section with controls - condensed */}
            <div className="flex flex-shrink-0 select-none items-center space-x-1">
              {UndoRedo && <div className="flex scale-90 items-center">{UndoRedo}</div>}
              {PatientInfo && <div className="text-xs">{PatientInfo}</div>}
              <div className="flex-shrink-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:bg-primary-dark h-8 w-8"
                    >
                      <Icons.GearSettings className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {menuOptions
                      .filter(option => option.title !== 'About RADFLARE VIEWER')
                      .map((option, index) => {
                        const IconComponent = option.icon
                          ? Icons[option.icon as keyof typeof Icons]
                          : null;
                        return (
                          <DropdownMenuItem
                            key={index}
                            onSelect={option.onClick}
                            className="flex items-center gap-2 py-2"
                          >
                            {IconComponent && (
                              <span className="flex h-4 w-4 items-center justify-center">
                                <Icons.ByName
                                  name={
                                    typeof IconComponent === 'string' ? IconComponent : 'component'
                                  }
                                />
                              </span>
                            )}
                            <span className="flex-1">{option.title}</span>
                          </DropdownMenuItem>
                        );
                      })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
          {/* Second row - Full-width toolbar */}
          <div className="border-border/20 bg-background/95 relative h-[44px] border-t backdrop-blur-sm">
            <div className="flex h-full items-center px-2">
              <div className="w-full">{children}</div>
            </div>
          </div>
        </div>
      </NavBar>
    </IconPresentationProvider>
  );
}

export default Header;
