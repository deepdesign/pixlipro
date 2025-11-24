import { cn } from "@/lib/utils";

import {
  Tab,
  TabGroup,
  TabList,
  TabPanels,
  TabPanel,
  type TabGroupProps,
  type TabListProps,
  type TabPanelsProps,
} from "@headlessui/react";
import type { ReactNode } from "react";

type TabsProps = TabGroupProps<"div">;

export const Tabs = ({ children, ...props }: TabsProps) => (
  <TabGroup {...props}>{children}</TabGroup>
);

type TabsTriggerListProps = TabListProps<"div"> & {
  className?: string;
  children: ReactNode;
  variant?: "default" | "top";
};

export const TabsTriggerList = ({
  children,
  className,
  variant = "default",
  ...props
}: TabsTriggerListProps) => {
  const variantClass = variant === "top" ? "tabs-top" : "retro-tabs";
  return (
    <TabList className={cn(variantClass, className)} {...props}>
    {children}
  </TabList>
);
};

type PrimitiveTabProps = React.ComponentProps<typeof Tab>;

interface TabsTriggerProps
  extends Omit<PrimitiveTabProps, "className" | "children"> {
  className?: string;
  children: ReactNode;
  variant?: "default" | "top";
}

export const TabsTrigger = ({
  className,
  children,
  variant = "default",
  ...props
}: TabsTriggerProps) => {
  const getTabClass = (selected: boolean) => {
    if (variant === "top") {
      return cn("tab-top", selected && "tab-top-active", className);
    }
    return cn("retro-tab", selected && "retro-tab-active", className);
  };

  return (
  <Tab
    {...props}
      className={({ selected }: { selected: boolean }) => getTabClass(selected)}
  >
    {children}
  </Tab>
);
};

type PrimitiveTabPanelsProps = TabPanelsProps<"div"> & {
  className?: string;
  children: ReactNode;
};

export const TabsPanels = ({
  className,
  children,
  ...props
}: PrimitiveTabPanelsProps) => (
  <TabPanels className={className} {...props}>
    {children}
  </TabPanels>
);

type PrimitiveTabPanelProps = React.ComponentProps<typeof TabPanel>;

interface TabsContentProps
  extends Omit<PrimitiveTabPanelProps, "className" | "children"> {
  className?: string;
  children: ReactNode;
}

export const TabsContent = ({
  className,
  children,
  ...props
}: TabsContentProps) => (
  <TabPanel className={cn("tab-panel", className)} {...props}>
    {children}
  </TabPanel>
);
