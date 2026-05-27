import { ActivityIcon } from "@/components/activity/activity-icon";

type CategoryIconProps = {
  name: string;
  size?: number;
};

/** Category names match trip activities; reuse the same Material icon mapping. */
export function CategoryIcon({ name, size = 18 }: CategoryIconProps) {
  return <ActivityIcon name={name} selected size={size} />;
}
