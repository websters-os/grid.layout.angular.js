(function () {
    angular.module('grid.layout', [])
        .component('webGrid', new WebGrid())
        .component('webGridItem', new WebGridItem());

    function WebGrid() {
        this.bindings = {
            columns: '<'
        };

        this.controller = ['$element', function (el) {
            var $ctrl = this;
            $ctrl.items = [];
            var totalColumns;

            $ctrl.$onChanges = function () {
                totalColumns = $ctrl.columns > 0 ? $ctrl.columns : 4;
                updateGridStyling();
                $ctrl.grid = [];
                $ctrl.items.forEach(function (item) {
                    var pos = findNextAvailableSlot(item.colspan);
                    item.column = pos.column;
                    item.row = pos.row;
                    markGridSlotAndUpdateListener(item);
                });
            };

            $ctrl.registerItem = function (colspan, rowspan, onUpdate) {
                colspan = parseInt(colspan) || 1;
                rowspan = parseInt(rowspan) || 1;
                var pos = findNextAvailableSlot(colspan);
                var item = {
                    index: $ctrl.items.length,
                    column: pos.column,
                    row: pos.row,
                    colspan: colspan,
                    rowspan: rowspan,
                    onUpdate: onUpdate
                };
                $ctrl.items.push(item);
                markGridSlotAndUpdateListener(item);
                return item;
            };

            $ctrl.updateItem = function (item) {
                $ctrl.grid = [];
                $ctrl.items.forEach(function (it) {
                    if (it.index === item.index) {
                        it.colspan = item.colspan;
                        it.rowspan = item.rowspan;
                    }
                    var pos = findNextAvailableSlot(it.colspan);
                    it.column = pos.column;
                    it.row = pos.row;
                    markGridSlotAndUpdateListener(it);
                });
            };

            $ctrl.removeItem = function (item) {
                $ctrl.items = $ctrl.items.filter(function (it) {
                    return it.index !== item.index;
                });
                $ctrl.$onChanges();
            };

            function findNextAvailableSlot(colspan) {
                var pos, row = 0;
                while (pos === undefined) {
                    ensureRowExists(row);
                    for (var column = 0; column < totalColumns; column++) {
                        if (areEnoughSlotsAvailable(column, row, colspan)) {
                            pos = { column: column, row: row };
                            break;
                        }
                    }
                    row++;
                }
                return pos;
            }

            function areEnoughSlotsAvailable(column, row, colspan) {
                var isAvailable = true;
                for (var offset = 0; offset < colspan; offset++) {
                    var c = column + offset;
                    if (c >= totalColumns || $ctrl.grid[row][c] !== undefined) {
                        isAvailable = false;
                        break;
                    }
                }
                return isAvailable;
            }

            function markGridSlotAndUpdateListener(item) {
                markGridSlot(item);
                item.onUpdate(item);
            }

            function markGridSlot(item) {
                for (var r = item.row; r < item.row + item.rowspan; r++) {
                    for (var c = item.column; c < item.column + item.colspan; c++) {
                        ensureRowExists(r);
                        $ctrl.grid[r][c] = item.index;
                    }
                }
            }

            function ensureRowExists(row) {
                if ($ctrl.grid[row] === undefined) $ctrl.grid[row] = [];
            }

            function updateGridStyling() {
                el[0].style['-ms-grid-columns'] = '(1fr)[' + totalColumns + ']';
                el[0].style['grid-template-columns'] = 'repeat(' + totalColumns + ', 1fr)';
            }
        }];
    }

    function WebGridItem() {
        this.bindings = {
            colspan: '<',
            rowspan: '<'
        };

        this.require = {
            gridCtrl: '^^webGrid'
        };

        this.controller = ['$element', function (el) {
            var $ctrl = this;

            $ctrl.$onChanges = function () {
                if (!$ctrl.item) $ctrl.item = $ctrl.gridCtrl.registerItem($ctrl.colspan, $ctrl.rowspan, onUpdate);
                else {
                    $ctrl.item.colspan = $ctrl.colspan;
                    $ctrl.item.rowspan = $ctrl.rowspan;
                    $ctrl.gridCtrl.updateItem($ctrl.item);
                }
            };

            $ctrl.$onDestroy = function () {
                $ctrl.gridCtrl.removeItem($ctrl.item);
            };

            function onUpdate(item) {
                var style = el[0].style;
                var column = item.column + 1;
                var row = item.row + 1;

                style['-ms-grid-column'] = column;
                style['-ms-grid-column-span'] = item.colspan;
                style['-ms-grid-row'] = row;
                style['-ms-grid-row-span'] = item.rowspan;

                style['grid-column-start'] = column;
                style['grid-column-end'] = item.colspan + column;
                style['grid-row-start'] = row;
                style['grid-row-end'] = item.rowspan + row;
            }
        }];
    }
})();