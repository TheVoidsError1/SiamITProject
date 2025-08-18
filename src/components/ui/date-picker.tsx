import * as React from "react"
import { format } from "date-fns"
import { th, enUS } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DatePickerProps {
  date?: string
  onDateChange: (date: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DatePicker({ 
  date, 
  onDateChange, 
  placeholder = "เลือกวันที่",
  disabled = false,
  className 
}: DatePickerProps) {
  const { t, i18n } = useTranslation()
  const currentLocale = i18n.language === 'th' ? th : enUS
  
  // Convert string date to Date object for calendar
  const selectedDate = date ? new Date(date) : undefined
  
  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      // Format date as YYYY-MM-DD for input compatibility
      const formattedDate = format(selectedDate, 'yyyy-MM-dd')
      onDateChange(formattedDate)
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? (
            format(selectedDate!, "dd MMMM yyyy", { locale: currentLocale })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          disabled={disabled}
          initialFocus
          locale={currentLocale}
        />
      </PopoverContent>
    </Popover>
  )
}
