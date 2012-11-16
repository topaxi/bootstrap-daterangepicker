/**
* @author: Dan Grossman http://www.dangrossman.info/
* @author: Damian Senn <damian.senn@gmail.com>
* @copyright: Copyright (c) 2012 Dan Grossman. All rights reserved.
* @license: Licensed under Apache License v2.0. See http://www.apache.org/licenses/LICENSE-2.0
* @website: http://www.improvely.com/
* This is a fork of https://github.com/dangrossman/bootstrap-daterangepicker
* Changes:
* - Migrated from datejs to momentjs
* - Added AMD support
*/
!function ($) {

    var DateRangePicker = function (element, options) {
        var hasOptions = typeof options == 'object';
        var today = moment().startOf('day');
        var localeObject;

        //state
        this.startDate = today;
        this.endDate = today;
        this.minDate = false;
        this.maxDate = false;
        this.changed = false;
        this.ranges = {};
        this.opens = 'right';
        this.update = hasOptions && options.update || function () { };
        this.format = 'MM/DD/YYYY';
        this.locale = {
            applyLabel:"Apply",
            fromLabel:"From",
            toLabel:"To",
            customRangeLabel:"Custom Range",
            firstDay:0
        };

        localeObject = this.locale;

        this.leftCalendar = {
            month: moment().startOf('day').day(1).month(this.startDate.month()).year(this.startDate.year()),
            calendar: []
        };

        this.rightCalendar = {
            month: moment().startOf('day').day(1).month(this.endDate.month()).year(this.endDate.year()),
            calendar: []
        };

        //element that triggered the date range picker
        this.element = $(element);

        if (this.element.hasClass('pull-right'))
            this.opens = 'left';

        if (this.element.is('input')) {
            this.element.on({
                click: $.proxy(this.show, this),
                focus: $.proxy(this.show, this),
                blur: $.proxy(this.hide, this)
            });
        } else {
            this.element.on('click', $.proxy(this.show, this));
        }

        if (hasOptions) {
            if(typeof options.locale == 'object') {
                $.each(localeObject, function (property, value) {
                    localeObject[property] = options.locale[property] || value;
                });
            }
        }

        var DRPTemplate = '<div class="daterangepicker dropdown-menu">' +
                '<div class="calendar left"></div>' +
                '<div class="calendar right"></div>' +
                '<div class="ranges">' +
                  '<div class="range_inputs">' +
                    '<div style="float: left">' +
                      '<label for="daterangepicker_start">' + this.locale.fromLabel + '</label>' +
                      '<input class="input-mini" type="text" name="daterangepicker_start" value="" disabled="disabled" />' +
                    '</div>' +
                    '<div style="float: left; padding-left: 11px">' +
                      '<label for="daterangepicker_end">' + this.locale.toLabel + '</label>' +
                      '<input class="input-mini" type="text" name="daterangepicker_end" value="" disabled="disabled" />' +
                    '</div>' +
                    '<button class="btn btn-small btn-success" disabled="disabled">' + this.locale.applyLabel + '</button>' +
                  '</div>' +
                '</div>' +
              '</div>';

        //the date range picker
        this.container = $(DRPTemplate).appendTo('body');

        if (hasOptions) {

            if (typeof options.format == 'string')
                this.format = options.format;

            if (typeof options.startDate == 'string')
                this.startDate = moment(options.startDate, this.format);

            if (typeof options.endDate == 'string')
                this.endDate = moment(options.endDate, this.format);

            if (typeof options.minDate == 'string')
                this.minDate = moment(options.minDate, this.format);

            if (typeof options.maxDate == 'string')
                this.maxDate = moment(options.maxDate, this.format);


            if (typeof options.startDate == 'object')
                this.startDate = options.startDate;

            if (typeof options.endDate == 'object')
                this.endDate = options.endDate;

            if (typeof options.minDate == 'object')
                this.minDate = options.minDate;

            if (typeof options.maxDate == 'object')
                this.maxDate = options.maxDate;

            if (typeof options.ranges == 'object') {
                for (var range in options.ranges) {

                    var start = options.ranges[range][0];
                    var end = options.ranges[range][1];

                    if (typeof start == 'string')
                        start = moment(start);

                    if (typeof end == 'string')
                        end = moment(end);

                    // If we have a min/max date set, bound this range
                    // to it, but only if it would otherwise fall
                    // outside of the min/max.
                    if (this.minDate && start < this.minDate)
                        start = this.minDate;

                    if (this.maxDate && end > this.maxDate)
                        end = this.maxDate;

                    // If the end of the range is before the minimum (if min is set) OR
                    // the start of the range is after the max (also if set) don't display this
                    // range option.
                    if ((this.minDate && end < this.minDate) || (this.maxDate && start > this.maxDate))
                    {
                        continue;
                    }

                    this.ranges[range] = [start, end];
                }

                var list = '<ul>';
                for (var range in this.ranges) {
                    list += '<li>' + range + '</li>';
                }
                list += '<li>' + this.locale.customRangeLabel + '</li>';
                list += '</ul>';
                this.container.find('.ranges').prepend(list);
            }

            // update day names order to firstDay
            if (options.locale && typeof options.locale.firstDay == 'number') {
                this.locale.firstDay = options.locale.firstDay;
            }

            if (typeof options.opens == 'string')
                this.opens = options.opens;
        }

        if (this.opens == 'right') {
            //swap calendar positions
            var left = this.container.find('.calendar.left');
            var right = this.container.find('.calendar.right');
            left.removeClass('left').addClass('right');
            right.removeClass('right').addClass('left');
        }

        if (typeof options == 'undefined' || typeof options.ranges == 'undefined')
            this.container.find('.calendar').show();

        this.container.addClass('opens' + this.opens);

        //event listeners
        this.container.on('mousedown', $.proxy(this.mousedown, this));
        this.container.find('.calendar').on('click', '.prev', $.proxy(this.clickPrev, this));
        this.container.find('.calendar').on('click', '.next', $.proxy(this.clickNext, this));
        this.container.find('.ranges').on('click', 'button', $.proxy(this.clickApply, this));

        this.container.find('.calendar').on('click', 'td.available', $.proxy(this.clickDate, this));
        this.container.find('.calendar').on('mouseenter', 'td.available', $.proxy(this.enterDate, this));
        this.container.find('.calendar').on('mouseleave', 'td.available', $.proxy(this.updateView, this));

        this.container.find('.ranges').on('click', 'li', $.proxy(this.clickRange, this));
        this.container.find('.ranges').on('mouseenter', 'li', $.proxy(this.enterRange, this));
        this.container.find('.ranges').on('mouseleave', 'li', $.proxy(this.updateView, this));

        this.element.on('keyup', $.proxy(this.updateFromControl, this));

        this.updateView();
        this.updateCalendars();

    };

    DateRangePicker.prototype = {

        constructor: DateRangePicker,

        mousedown: function (e) {
            e.stopPropagation();
            e.preventDefault();
        },

        updateView: function () {
            this.leftCalendar.month.month(this.startDate.month())
                                   .year(this.startDate.year());

            this.rightCalendar.month.month(this.endDate.month())
                                    .year(this.endDate.year());

            this.container.find('input[name=daterangepicker_start]')
                          .val(this.startDate.format(this.format));
            this.container.find('input[name=daterangepicker_end]')
                          .val(this.endDate.format(this.format));

            if (this.startDate.diff(this.endDate) <= 0) {
                this.container.find('button').removeAttr('disabled');
            } else {
                this.container.find('button').prop('disabled', true);
            }
        },

        updateFromControl: function () {
            if (!this.element.is('input')) return;

            var dateString = this.element.val().split(" - ");
            var start = moment(dateString[0], this.format);
            var end = moment(dateString[1], this.format);

            if (start == null || end == null) return;
            if (end.diff(start) < 0) return;

            this.startDate = start;
            this.endDate = end;

            this.updateView();
            this.update(this.startDate, this.endDate);
            this.updateCalendars();
        },

        notify: function () {
            this.updateView();

            if (this.element.is('input')) {
                this.element.val(this.startDate.format(this.format) + ' - ' + this.endDate.format(this.format));
            }
            this.update(this.startDate, this.endDate);
        },

        move: function () {
            if (this.opens == 'left') {
                this.container.css({
                    top: this.element.offset().top + this.element.outerHeight(),
                    right: $(window).width() - this.element.offset().left - this.element.outerWidth(),
                    left: 'auto'
                });
            } else {
                this.container.css({
                    top: this.element.offset().top + this.element.outerHeight(),
                    left: this.element.offset().left,
                    right: 'auto'
                });
            }
        },

        show: function (e) {
            this.container.show();
            this.move();

            if (e) {
                e.stopPropagation();
                e.preventDefault();
            }

            this.changed = false;

            $(document).on('mousedown', $.proxy(this.hide, this));
        },

        hide: function (e) {
            this.container.hide();
            $(document).off('mousedown', this.hide);

            if (this.changed)
                this.notify();
        },

        enterRange: function (e) {
            var label = e.target.innerHTML;
            if (label == this.locale.customRangeLabel) {
                this.updateView();
            } else {
                var dates = this.ranges[label];
                this.container.find('input[name=daterangepicker_start]')
                              .val(dates[0].format(this.format));
                this.container.find('input[name=daterangepicker_end]')
                              .val(dates[1].format(this.format));
            }
        },

        clickRange: function (e) {
            var label = e.target.innerHTML;
            if (label == this.locale.customRangeLabel) {
                this.container.find('.calendar').show();
            } else {
                var dates = this.ranges[label];

                this.startDate = dates[0];
                this.endDate = dates[1];

                this.leftCalendar.month.month(this.startDate.month())
                                       .year(this.startDate.year());
                this.rightCalendar.month.month(this.endDate.month())
                                        .year(this.endDate.year());
                this.updateCalendars();

                this.changed = true;

                this.container.find('.calendar').hide();
                this.hide();
            }
        },

        clickPrev: function (e) {
            var cal = $(e.target).closest('.calendar');
            if (cal.hasClass('left')) {
                this.leftCalendar.month.subtract('months', 1);
            } else {
                this.rightCalendar.month.subtract('months', 1);
            }
            this.updateCalendars();
        },

        clickNext: function (e) {
            var cal = $(e.target).closest('.calendar');
            if (cal.hasClass('left')) {
                this.leftCalendar.month.add('months', 1);
            } else {
                this.rightCalendar.month.add('months', 1);
            }
            this.updateCalendars();
        },

        enterDate: function (e) {
            var el    = $(e.target)
            var row   = el.data('row');
            var col   = el.data('col');
            var cal   = el.closest('.calendar');

            if (cal.hasClass('left')) {
                this.container.find('input[name=daterangepicker_start]')
                              .val(this.leftCalendar.calendar[row][col].format(this.format));
            } else {
                this.container.find('input[name=daterangepicker_end]')
                              .val(this.rightCalendar.calendar[row][col].format(this.format));
            }

        },

        clickDate: function (e) {
            var el    = $(e.target)
            var row   = el.data('row');
            var col   = el.data('col');
            var cal   = el.closest('.calendar');

            if (cal.hasClass('left')) {
                startDate = this.leftCalendar.calendar[row][col];
                endDate = this.endDate;
            } else {
                startDate = this.startDate;
                endDate = this.rightCalendar.calendar[row][col];
            }

            cal.find('td').removeClass('active');

            if (startDate.diff(endDate) <= 0) {
                $(e.target).addClass('active');
                if (startDate.diff(this.startDate) || endDate.diff(this.endDate))
                    this.changed = true;
                this.startDate = startDate;
                this.endDate = endDate;
            }

            this.leftCalendar.month.month(this.startDate.month())
                                   .year(this.startDate.year());
            this.rightCalendar.month.month(this.endDate.month())
                                    .year(this.endDate.year());
            this.updateCalendars();
        },

        clickApply: function (e) {
            this.hide();
        },

        updateCalendars: function () {
            this.leftCalendar.calendar = this.buildCalendar(this.leftCalendar.month.month(), this.leftCalendar.month.year());
            this.rightCalendar.calendar = this.buildCalendar(this.rightCalendar.month.month(), this.rightCalendar.month.year());
            this.container.find('.calendar.left').html(this.renderCalendar(this.leftCalendar.calendar, this.startDate, this.minDate, this.endDate));
            this.container.find('.calendar.right').html(this.renderCalendar(this.rightCalendar.calendar, this.endDate, this.startDate, this.maxDate));
        },

        buildCalendar: function (month, year) {
            var firstDay  = moment().startOf('day').date(1).month(month).year(year);
            var lastMonth = firstDay.clone().subtract('days', 1);
            var lastYear  = lastMonth.year();
            lastMonth = lastMonth.month();

            var daysInMonth     = new Date(year, month + 1, 0).getDate();
            var daysInLastMonth = new Date(lastYear, lastMonth + 1, 0).getDate();

            var dayOfWeek = firstDay.day();

            //initialize a 6 rows x 7 columns array for the calendar
            var calendar = [[],[],[],[],[],[]];

            //populate the calendar with date objects
            var startDay = daysInLastMonth - dayOfWeek + this.locale.firstDay + 1;
            if (startDay > daysInLastMonth)
                startDay -= 7;

            if (dayOfWeek == this.locale.firstDay)
                startDay = daysInLastMonth - 6;

            var curDate = moment().startOf('day').date(startDay).month(lastMonth).year(lastYear);
            for (var i = 0, col = 0, row = 0; i < 42; i++, col++, curDate = curDate.clone().add('days', 1)) {
                if (i > 0 && col % 7 == 0) {
                    col = 0;
                    row++;
                }
                calendar[row][col] = curDate;
            }

            return calendar;

        },

        renderCalendar: function (calendar, selected, minDate, maxDate) {
            var html = '<table class="table-condensed">';
            html += '<thead>';
            html += '<tr>';
            if (!minDate || minDate < calendar[1][1])
            {
                html += '<th class="prev available"><i class="icon-arrow-left"></i></th>';
            }
            else
            {
                 html += '<th></th>';
            }
            html += '<th colspan="5">' + calendar[1][1].format("MMMM YYYY") + '</th>';
            if (!maxDate || maxDate > calendar[1][1])
            {
                html += '<th class="next available"><i class="icon-arrow-right"></i></th>';
            }
            else
            {
                 html += '<th></th>';
            }

            html += '</tr>';
            html += '<tr>';

            for (var i = this.locale.firstDay; i < 7; i++) {
                html += '<th>' + moment.weekdaysMin[i] + '</th>';
            }
            for (var i = 0; i < this.locale.firstDay; i++) {
                html += '<th>' + moment.weekdaysMin[i] + '</th>';
            }

            html += '</tr>';
            html += '</thead>';
            html += '<tbody>';

            for (var row = 0; row < 6; row++) {
                html += '<tr>';
                for (var col = 0; col < 7; col++) {
                    var cname = 'available ';
                    cname += (calendar[row][col].month() == calendar[1][1].month()) ? '' : 'off';

                    // Normalise the time so the comparison won't fail
                    selected.startOf('hour');

                    if ( (minDate && calendar[row][col] < minDate) || (maxDate && calendar[row][col] > maxDate))
                    {
                        cname = 'off disabled';
                    }
                    else if (!calendar[row][col].diff(selected))
                    {
                        cname += 'active';
                    }

                    var title = calendar[row][col].format(this.format);
                    html += '<td class="' + cname + '" title="' + title + '" data-row="' + row + '" data-col="'+ col +'">' + calendar[row][col].date() + '</td>';
                }
                html += '</tr>';
            }

            html += '</tbody>';
            html += '</table>';

            return html;

        }

    };

    $.fn.daterangepicker = function (options) {
      if (options == 'getRange') {
        var picker = $(this[0]).data('daterangepicker')

        return [picker.startDate, picker.endDate]
      }

      this.each(function() {
        var el = $(this);

        if (!el.data('daterangepicker')) {
          el.data('daterangepicker', new DateRangePicker(el, options));
        }
      });
      return this;
    };

    if (typeof define == 'function' && typeof define.amd == 'object' &&
        define.amd) {

      define(function() { return DateRangePicker })
    }

} (window.jQuery);
