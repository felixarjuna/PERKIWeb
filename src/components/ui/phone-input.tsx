import { CheckIcon, ChevronsUpDown } from "lucide-react";
import type { ComponentProps, ComponentRef, Ref } from "react";
import PhoneInputWithCountrySelect, {
  type Country,
  type FlagProps,
  getCountryCallingCode,
  type Props as PhoneInputWithCountrySelectProps,
  type Value,
} from "react-phone-number-input";
import flags from "react-phone-number-input/flags";

import { Button } from "~/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import { Input } from "~/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { ScrollArea } from "~/components/ui/scroll-area";
import { cn } from "~/lib/utils";

type PhoneInputProps = Omit<
  ComponentProps<"input">,
  "onChange" | "value" | "ref"
> &
  Omit<
    PhoneInputWithCountrySelectProps<typeof PhoneInputWithCountrySelect>,
    "onChange"
  > & {
    onChange?: (value: Value) => void;
    ref?: Ref<ComponentRef<typeof PhoneInputWithCountrySelect>>;
  };

function PhoneInput({ className, onChange, ref, ...props }: PhoneInputProps) {
  return (
    <PhoneInputWithCountrySelect
      className={cn("flex", className)}
      countrySelectComponent={CountrySelect}
      flagComponent={FlagComponent}
      inputComponent={InputComponent}
      /**
       * Handles the onChange event.
       *
       * react-phone-number-input might trigger the onChange event as undefined
       * when a valid phone number is not entered. To prevent this,
       * the value is coerced to an empty string.
       */
      onChange={(value) => onChange?.(value ?? ("" as Value))}
      ref={ref}
      smartCaret={false}
      {...props}
    />
  );
}

function InputComponent({ className, ...props }: ComponentProps<"input">) {
  return (
    <Input
      className={cn("rounded-s-none rounded-e-lg", className)}
      {...props}
    />
  );
}

interface CountryEntry {
  label: string;
  value: Country | undefined;
}

interface CountrySelectProps {
  disabled?: boolean;
  onChange: (country: Country) => void;
  options: CountryEntry[];
  value: Country;
}

function CountrySelect({
  disabled,
  value: selectedCountry,
  options: countryList,
  onChange,
}: CountrySelectProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className="flex gap-1 rounded-s-lg rounded-e-none border-0 border-r-0 bg-accent/50 px-3 hover:bg-accent/80 focus:z-10 dark:bg-accent/60 dark:hover:bg-accent/80"
          disabled={disabled}
          type="button"
          variant="outline"
        >
          <FlagComponent
            country={selectedCountry}
            countryName={selectedCountry}
          />
          <ChevronsUpDown
            className={cn(
              "-mr-2 size-4 opacity-50",
              disabled ? "hidden" : "opacity-100"
            )}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search country..." />
          <CommandList>
            <ScrollArea className="h-72">
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup>
                {countryList.map(({ value, label }) =>
                  value ? (
                    <CountrySelectOption
                      country={value}
                      countryName={label}
                      key={value}
                      onChange={onChange}
                      selectedCountry={selectedCountry}
                    />
                  ) : null
                )}
              </CommandGroup>
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface CountrySelectOptionProps extends FlagProps {
  onChange: (country: Country) => void;
  selectedCountry: Country;
}

function CountrySelectOption({
  country,
  countryName,
  selectedCountry,
  onChange,
}: CountrySelectOptionProps) {
  return (
    <CommandItem className="gap-2" onSelect={() => onChange(country)}>
      <FlagComponent country={country} countryName={countryName} />
      <span className="flex-1 text-sm">{countryName}</span>
      <span className="text-foreground/50 text-sm">{`+${getCountryCallingCode(
        country
      )}`}</span>
      <CheckIcon
        className={`ml-auto size-4 ${
          country === selectedCountry ? "opacity-100" : "opacity-0"
        }`}
      />
    </CommandItem>
  );
}

function FlagComponent({ country, countryName }: FlagProps) {
  const Flag = flags[country];

  return (
    <span className="flex h-4 w-6 overflow-hidden rounded-sm bg-foreground/20 [&_svg]:size-full">
      {Flag ? <Flag title={countryName} /> : null}
    </span>
  );
}

export { PhoneInput };
