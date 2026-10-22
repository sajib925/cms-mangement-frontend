import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils.ts";

export type SelectItemType = {
  label: string;
  value: string;
};

interface Props {
  triggerClassName?: string;
  contentClassName?: string;
  items: SelectItemType[];
  value: string;
  setValue: (value: string) => void;
}

export const CustomSelect = ({ triggerClassName, contentClassName, setValue, value, items }: Props) => {
  return (

      <Select defaultValue={items[0].value} value={value} onValueChange={setValue}>
        <SelectTrigger
          className={cn(
            "h-[26px] w-[172px] rounded !border !border-[#FFFFFF21] bg-[#292929] text-[12px]",
            triggerClassName,
          )}
        >
          <SelectValue placeholder="Select a fruit" />
        </SelectTrigger>
        <SelectContent className={cn("!bg-[#373737] !p-0", contentClassName)}>
          <SelectGroup className={cn("!p-0 w-[236px]", contentClassName)}>
            {items.map((item: SelectItemType , index) => (
              <SelectItem key={index} value={item.value}>{item.label}</SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
  );
};
