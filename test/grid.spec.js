beforeEach(module('grid.layout'));

describe('web-grid component', function () {
    var $ctrl, $element;
    var dummy = function () { };

    beforeEach(inject(function ($componentController) {
        $element = [{
            style: {}
        }];
        $ctrl = $componentController('webGrid', { $element: $element }, null);
        $ctrl.$onChanges();
    }));

    it('apply grid styling to element', function () {
        expect($element[0].style['-ms-grid-columns']).toEqual('(1fr)[4]');
        expect($element[0].style['grid-template-columns']).toEqual('repeat(4, 1fr)');
    });

    it('grid is empty', function () {
        expect($ctrl.grid).toEqual([]);
    });

    describe('when specifying a column count', function () {
        beforeEach(function () {
            $ctrl.columns = 2;
            $ctrl.$onChanges();
        });

        it('update grid styling', function () {
            expect($element[0].style['-ms-grid-columns']).toEqual('(1fr)[2]');
            expect($element[0].style['grid-template-columns']).toEqual('repeat(2, 1fr)');
        });
    });

    it('add first item to grid', function () {
        $ctrl.registerItem(1, 1, dummy);
        expect($ctrl.grid).toEqual([[0]]);
    });

    it('colspan and rowspan should default to 1', function () {
        $ctrl.registerItem(0, 0, dummy);
        expect($ctrl.grid).toEqual([[0]]);
    });

    it('add item should overflow to next row', function () {
        $ctrl.registerItem(1, 1, dummy);
        $ctrl.registerItem(1, 1, dummy);
        $ctrl.registerItem(1, 1, dummy);
        $ctrl.registerItem(1, 1, dummy);
        $ctrl.registerItem(1, 1, dummy);
        expect($ctrl.grid).toEqual([
            [0, 1, 2, 3],
            [4]
        ]);
    });

    it('add item spanning multiple columns', function () {
        $ctrl.registerItem(2, 1, dummy);
        expect($ctrl.grid).toEqual([[0, 0]]);
    });

    it('add item spanning multiple rows', function () {
        $ctrl.registerItem(1, 2, dummy);
        expect($ctrl.grid).toEqual([
            [0],
            [0]
        ]);
    });

    it('add item spanning multiple columns and rows', function () {
        $ctrl.registerItem(2, 2, dummy);
        expect($ctrl.grid).toEqual([
            [0, 0],
            [0, 0]
        ]);
    });

    it('add item should take the next available space', function () {
        $ctrl.registerItem(2, 2, dummy);
        $ctrl.registerItem(2, 1, dummy);
        expect($ctrl.grid).toEqual([
            [0, 0, 1, 1],
            [0, 0]
        ]);
    });

    it('add item should take the next available space, even if it is on a new row', function () {
        $ctrl.registerItem(2, 2, dummy);
        $ctrl.registerItem(2, 1, dummy);
        $ctrl.registerItem(3, 1, dummy);
        expect($ctrl.grid).toEqual([
            [0, 0, 1, 1],
            [0, 0],
            [2, 2, 2]
        ]);
    });

    it('add item should fill in gaps if possible', function () {
        $ctrl.registerItem(2, 2, dummy);
        $ctrl.registerItem(2, 1, dummy);
        $ctrl.registerItem(3, 1, dummy);
        $ctrl.registerItem(1, 1, dummy);
        $ctrl.registerItem(1, 1, dummy);
        $ctrl.registerItem(1, 1, dummy);
        expect($ctrl.grid).toEqual([
            [0, 0, 1, 1],
            [0, 0, 3, 4],
            [2, 2, 2, 5]
        ]);
    });

    describe('with an existing grid', function () {
        var listeners = [];
        var items = [];

        beforeEach(function () {
            for (var i = 0; i <= 5; i++) {
                listeners[i] = jasmine.createSpy();
            }
            items.push($ctrl.registerItem(2, 2, listeners[0]));
            items.push($ctrl.registerItem(2, 1, listeners[1]));
            items.push($ctrl.registerItem(1, 1, listeners[2]));
            items.push($ctrl.registerItem(2, 1, listeners[3]));
            items.push($ctrl.registerItem(1, 2, listeners[4]));
            items.push($ctrl.registerItem(1, 1, listeners[5]));
        });

        describe('and column count changes', function () {
            beforeEach(function () {
                $ctrl.columns = 3;
                $ctrl.$onChanges();
            });

            it('grid is updated', function () {
                expect($ctrl.grid).toEqual([
                    [0, 0, 2],
                    [0, 0, 4],
                    [1, 1, 4],
                    [3, 3, 5]
                ]);
            });

            it('update listeners are called', function () {
                for (var i = 0; i <= 5; i++) {
                    expect(listeners[i]).toHaveBeenCalledWith($ctrl.items[i]);
                }
            });

            describe('column count changes back', function () {
                beforeEach(function () {
                    $ctrl.columns = 4;
                    $ctrl.$onChanges();
                });

                it('grid is updated', function () {
                    expect($ctrl.grid).toEqual([
                        [0, 0, 1, 1],
                        [0, 0, 2, 4],
                        [3, 3, 5, 4]
                    ]);
                });
            });
        });

        it('on item update', function () {
            var item = items[0];
            item.colspan = 1;
            item.rowspan = 1;
            $ctrl.updateItem(item);
            expect($ctrl.grid).toEqual([
                [0, 1, 1, 2],
                [3, 3, 4, 5],
                [undefined, undefined, 4]
            ]);
        });
    });

    describe('with another grid', function () {
        var listeners = [];
        var items = [];

        beforeEach(function () {
            for (var i = 0; i <= 5; i++) {
                listeners[i] = jasmine.createSpy();
            }
            items.push($ctrl.registerItem(1, 1, listeners[0]));
            items.push($ctrl.registerItem(2, 2, listeners[1]));
            items.push($ctrl.registerItem(1, 1, listeners[2]));
            items.push($ctrl.registerItem(1, 1, listeners[3]));
            items.push($ctrl.registerItem(1, 1, listeners[4]));
            items.push($ctrl.registerItem(1, 1, listeners[5]));
        });

        it('on item update, assert item does not overlap other items', function () {
            var item = items[2];
            item.colspan = 2;
            item.rowspan = 1;
            $ctrl.updateItem(item);
            expect($ctrl.grid).toEqual([
                [0, 1, 1, 3],
                [4, 1, 1, 5],
                [2, 2]
            ]);
        });
    });
});

describe('web-grid-item component', function () {
    var $ctrl, $element, item;

    beforeEach(inject(function ($componentController) {
        $element = [{
            style: {}
        }];
        $ctrl = $componentController('webGridItem', { $element: $element }, { colspan: 2, rowspan: 1 });
        $ctrl.gridCtrl = jasmine.createSpyObj(['registerItem', 'updateItem']);
        item = {
            index: 0
        };
        $ctrl.gridCtrl.registerItem.and.returnValue(item);
        $ctrl.$onChanges();
    }));

    it('item is registered', function () {
        expect($ctrl.gridCtrl.registerItem).toHaveBeenCalledWith(2, 1, jasmine.any(Function));
    });

    it('on change detected', function () {
        $ctrl.colspan = 3;
        $ctrl.$onChanges();
        expect($ctrl.gridCtrl.updateItem).toHaveBeenCalledWith(item);
    });

    it('update element styling', function () {
        item.column = 4;
        item.row = 3;
        item.colspan = 1;
        item.rowspan = 2;
        $ctrl.gridCtrl.registerItem.calls.mostRecent().args[2](item);
        expect($element[0].style['-ms-grid-column']).toEqual(5);
        expect($element[0].style['-ms-grid-column-span']).toEqual(1);
        expect($element[0].style['-ms-grid-row']).toEqual(4);
        expect($element[0].style['-ms-grid-row-span']).toEqual(2);
        expect($element[0].style['grid-column-start']).toEqual(5);
        expect($element[0].style['grid-column-end']).toEqual(6);
        expect($element[0].style['grid-row-start']).toEqual(4);
        expect($element[0].style['grid-row-end']).toEqual(6);
    });
});