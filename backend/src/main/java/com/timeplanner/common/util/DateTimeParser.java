package com.timeplanner.common.util;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;

public final class DateTimeParser {

    private DateTimeParser() {
    }

    public static LocalDateTime parseClientDateTime(String value) {
        try {
            return LocalDateTime.parse(value);
        } catch (DateTimeParseException ignored) {
            try {
                return OffsetDateTime.parse(value)
                        .atZoneSameInstant(ZoneId.systemDefault())
                        .toLocalDateTime();
            } catch (DateTimeParseException e) {
                throw new IllegalArgumentException("Invalid datetime: " + value, e);
            }
        }
    }
}
