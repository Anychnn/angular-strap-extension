(function (window, document) {
    "use strict";
    angular.module('kk.util', ['kk.util.tab', 'kk.util.tooltip', 'kk.util.typeahead', 'kk.util.select', 'kk.util.popover',
        'kk.util.modal', 'kk.util.spin', 'kk.util.slider', 'kk.util.pagination', 'kk.util.uploader']);

    angular.module('kk.util.select', ['kk.util.tooltip', 'kk.util.parseOptions'])
        .provider('$kkselect', [function () {
            var defaults = {
                trigger: 'focus',
                templateUrl: 'kk/select.tpl.html',
                placement: 'bottom-left',
                placeholder: '请选择一个...',
                caretHtml: '&nbsp;<span class="caret"></span>'
            }
            this.$get = ['$tooltip', '$kkparseOptions', function ($tooltip, $kkparseOptions) {
                function SelectFactory(element, controller, config) {
                    var $select;
                    var options = angular.extend({}, defaults, config);
                    $select = $tooltip(element, options);
                    var scope = $select.$scope;
                    scope.$matches = [];
                    scope.$isVisible = function () {
                        return $select.$isVisible();
                    }
                    scope.$select = function (index, evt) {
                        //这里用postDigest的目的是什么?...
                        // scope.$$postDigest(function () {
                        $select.select(index, evt);
                        // })
                    }

                    $select.select = function (index, evt) {
                        var value = scope.$matches[index].value;
                        // scope.$apply(function () {
                        controller.$setViewValue(value);
                        $select.activate(index);
                        $select.hide();
                        // })
                    }
                    $select.$onMouseDown = function (evt) {
                        evt.preventDefault();
                        evt.stopPropagation();
                    }
                    var show = $select.show;
                    $select.show = function () {
                        show();
                        $select.$element.on('mousedown', $select.$onMouseDown)
                        // $select.$element.on
                    }
                    var hide = $select.hide;
                    $select.hide = function () {
                        hide();
                        $select.$element.off('mousedown', $select.$onMouseDown)
                    }
                    $select.update = function (matches) {
                        scope.$matches = matches;
                        safeDigest(scope);
                    }
                    $select.$getIndex = function (value) {
                        var index;
                        for (index = scope.$matches.length; index--;) {
                            if (angular.equals(scope.$matches[index].value, value)) break;
                        }
                        return index;
                    }

                    $select.$isVisible = function () {
                        return scope.$matches.length;
                    }
                    scope.$isActive = $select.$isActive = function (index) {
                        return scope.$activeIndex === index;
                    }
                    $select.activate = function (index) {
                        scope.$activeIndex = index;
                    }

                    return $select;
                }

                SelectFactory.defaults = defaults;
                return SelectFactory;
            }]
        }])
        .directive('kkSelect', ['$kkselect', '$kkparseOptions', '$sce', function ($kkselect, $kkparseOptions, $sce) {
            var defaults = $kkselect.defaults;
            return {
                restrict: 'A',
                require: 'ngModel',
                link: function (scope, element, attr, controller) {
                    var options = {
                        scope: scope,
                        placeholder: defaults.placeholder
                    }
                    angular.forEach(['templateUrl', 'placement', 'trigger', 'animation', 'caretHtml', 'placeholder', 'html'], function (key) {
                        if (angular.isDefined(attr[key])) options[key] = attr[key];
                    })
                    var $select = $kkselect(element, controller, options);
                    var parsedOptions = $kkparseOptions(attr.kkOptions);

                    scope.$watch(attr.ngModel, function (newVal, oldVal) {
                        controller.$render();
                    })
                    scope.$watch(parsedOptions.valuesName, function (newValue, oldValue) {
                        var matches = parsedOptions.valuesFn(scope, controller);
                        if (options.html) {
                            var arr = [];
                            angular.forEach(matches, function (match) {
                                match.label = $sce.trustAsHtml(match.label);
                                arr.push(match);
                            })
                            $select.update(arr);
                        } else {
                            $select.update(matches);
                        }
                    })

                    controller.$render = function () {
                        var index = $select.$getIndex(controller.$modelValue);
                        var selectd = index !== -1 ? $select.$scope.$matches[index].label : false;
                        element.html((selectd || options.placeholder) + (options.caretHtml || defaults.caretHtml))
                    }
                }
            }
        }])
        .run(['$templateCache', function ($templateCache) {
            $templateCache.put('kk/select.tpl.html',
                '<ul tabindex="-1" class="select dropdown-menu" ng-show="$isVisible()" role="select">' +
                '<li ng-if="$showAllNoneButtons">' +
                '<div class="btn-group" style="margin-bottom: 5px; margin-left: 5px">' +
                '<button type="button" class="btn btn-default btn-xs" ng-click="$selectAll()">{{$allText}}</button> ' +
                '<button type="button" class="btn btn-default btn-xs" ng-click="$selectNone()">{{$noneText}}</button>' +
                '</div>' +
                '</li>' +
                '<li role="presentation" ng-repeat="match in $matches" ng-class="{active: $isActive($index)}">' +
                '<a style="cursor: default" role="menuitem" tabindex="-1" ng-click="$select($index, $event)">' +
                '<i class="{{$iconCheckmark}} pull-right" ng-if="$isMultiple && $isActive($index)"></i> ' +
                '<span ng-bind="match.label"></span>' +
                '</a>' +
                '</li>' +
                '</ul>'
            )
        }])

    /**
     * tab切换
     */
    angular.module('kk.util.tab', ['ngAnimate'])
        .provider('$tab', function () {
            var defaults = {
                templateUrl: 'kk/tab.tpl.html',
                activeClass: 'active',
                navClass: 'nav-tabs'
            }
            var controller = function ($scope) {
                var self = this;
                self.$options = angular.copy(defaults);
                $scope.$navClass = self.$options.navClass;
                $scope.$activeClass = self.$options.activeClass;
                self.$activePaneChangeListeners = $scope.$activePaneChangeListeners = [];
                self.$panes = $scope.$panes = [];
                self.$push = function (pane) {
                    self.$panes.push(pane);
                };
                self.$setActive = $scope.$setActive = function (value) {
                    self.$panes.$active = value;
                    self.$activePaneChangeListeners.forEach(function (fn) {
                        fn();
                    })
                }
                self.$isActive = $scope.$isActive = function ($pane, $index) {
                    return self.$panes.$active === $pane.name || self.$panes.$active === $index;
                };
            }
            this.$get = [function () {
                var $tab = {};
                $tab.controller = controller;
                $tab.defaults = defaults;
                return $tab;
            }];
        })
        .directive('kkTabSet', ['$tab', '$parse', function ($tab, $parse) {
            var defaults = $tab.defaults;
            return {
                restrict: 'EA',
                controller: ['$scope', $tab.controller],
                require: ['kkTabSet'],
                templateUrl: function (element, attr) {
                    return attr.templateUrl || $tab.defaults.templateUrl;
                },
                scope: true,
                transclude: true,
                link: function (scope, element, attrs, controllers) {
                    var tabsCtrl = controllers[0];
                    if (attrs.kkActiveTab) {
                        var parsedActivePane = $parse(attrs.kkActiveTab);
                        tabsCtrl.$activePaneChangeListeners.push(function () {
                            parsedActivePane.assign(scope, tabsCtrl.$panes.$active);
                        })
                        scope.$watch(attrs.kkActiveTab, function (newValue) {
                            tabsCtrl.$setActive(newValue);
                        }, true);
                    }

                }
            }
        }])
        .directive('kkTab', ['$sce', '$tab', '$animate', function ($sce, $tab, $animate) {
            return {
                restrict: 'EA',
                require: ['^kkTabSet'],
                scope: true,
                link: function (scope, element, attrs, controllers) {
                    var tabsCtrl = controllers[0];
                    element.addClass('tab-pane');
                    attrs.$observe('title', function (newVal) {
                        scope.title = $sce.trustAsHtml(newVal);
                    })
                    // scope.title=scope.$eval(attrs.title);
                    scope.name = attrs.name;
                    // if(!attrs.name){
                    //     scope.name=scope.title;
                    //     console.log(scope.name)
                    // }
                    tabsCtrl.$push(scope);
                    tabsCtrl.$activePaneChangeListeners.push(function () {
                        render();
                    })
                    function render() {
                        var index = tabsCtrl.$panes.indexOf(scope);
                        if (!scope.name) {
                            scope.name = scope.title;
                        }
                        $animate[tabsCtrl.$isActive(scope, index) ? 'addClass' : 'removeClass'](element, tabsCtrl.$options.activeClass);
                    }

                    render();
                }
            }
        }])
        .run(['$templateCache', function ($templateCache) {
            $templateCache.put('kk/tab.tpl.html',
                '<ul class="nav" ng-class="$navClass" role="tablist">' +
                '<li role="presentation" ng-repeat="$pane in $panes track by $index" ng-class="[ $isActive($pane, $index) ? $activeClass : \'\', $pane.disabled ? \'disabled\' : \'\' ]">' +
                '<a role="tab" data-toggle="tab" ng-click="!$pane.disabled && $setActive($pane.name || $index)" ' +
                'data-index="{{ $index }}" ng-bind-html="$pane.title" aria-controls="$pane.title" href="">' +
                '</a>' +
                '</li>' +
                '</ul>' +
                '<div ng-transclude class="tab-content"></div>'
            )
        }])

    /**
     * 预先输入
     */
    angular.module('kk.util.typeahead', ['kk.util.tooltip', 'kk.util.parseOptions'])
        .provider('$kktypeahead', function () {
            var defaults = this.defaults = {
                animation: 'am-fade',
                templateUrl: 'kk/typehead.tpl.html',
                trigger: 'focus',
                filter: 'kkAsyncFilter',
                autoSelect: false,
                placement: 'bottom-left',
                keyboard: true,
                limit: 6,
                comparator: '',
                minLength: 1
            }
            this.$get = ['$tooltip', '$timeout', function ($tooltip, $timeout) {
                function TypeaheadFactory(element, controller, config) {
                    var options = angular.extend({}, defaults, config);
                    var $typeahead = $tooltip(element, options);
                    var scope = $typeahead.$scope;
                    scope.$resetMatches = function () {
                        scope.$matches = [];
                        scope.$activeIndex = options.autoSelect ? 0 : -1;
                    }
                    scope.$resetMatches();
                    scope.$isVisible = function () {
                        return $typeahead.$isVisible();
                    }
                    scope.$select = function (index, event) {
                        scope.$$postDigest(function () {
                            $typeahead.select(index);
                        })
                    }
                    $typeahead.select = function (index) {
                        if (index === -1) return;
                        var value = scope.$matches[index].value;
                        controller.$setViewValue(value);
                        controller.$render();
                        scope.$resetMatches();
                        safeDigest(scope);
                        // $typeahead.hide();
                    }
                    var show = $typeahead.show;
                    /**
                     * 覆盖tooltip的show方法
                     */
                    $typeahead.show = function () {
                        show();
                        // $timeout(function () {
                        $typeahead.$element.on('mousedown', function (evt) {
                            evt.preventDefault();
                            evt.stopPropagation();
                        })
                        if (options.keyboard) {
                            element.on('keydown', $typeahead.$onKeyDown)
                        }
                        // })
                    }
                    /**
                     * 覆盖tooltip的hide方法
                     */
                    var hide = $typeahead.hide;
                    $typeahead.hide = function () {
                        hide();
                        if (options.keyboard) {
                            element.off('keydown', $typeahead.$onKeyDown)
                        }
                    }
                    $typeahead.$isVisible = function () {
                        return scope.$matches.length && controller.$viewValue.length >= options.minLength;
                    }

                    $typeahead.update = function (matches) {
                        scope.$matches = matches;
                        safeDigest(scope);
                    }
                    $typeahead.activate = function (index) {
                        scope.$activeIndex = index;
                    }
                    $typeahead.$getIndex = function (value) {
                        var index;
                        for (index = scope.$matches.length; index--;) {
                            if (angular.equals(scope.$matches[index].value, value)) break;
                        }
                        return index;
                    };
                    $typeahead.$onKeyDown = function (evt) {
                        if (!/(38|40|13|27)/.test(evt.keyCode)) return;
                        if ($typeahead.$isVisible() && !(evt.keyCode === 13 && scope.$activeIndex === -1)) {
                            //阻止事件传播 和 冒泡
                            evt.preventDefault();
                            evt.stopPropagation();
                        }
                        if (evt.keyCode === 13 && scope.$matches.length) {
                            $typeahead.select(scope.$activeIndex);
                        } else if (evt.keyCode === 27) {
                            $typeahead.hide();
                        } else if (evt.keyCode === 40) {
                            scope.$activeIndex = (++scope.$activeIndex) % scope.$matches.length;
                        } else if (evt.keyCode === 38) {
                            scope.$activeIndex = --scope.$activeIndex == -1 ? scope.$matches.length - 1 : scope.$activeIndex;
                        }
                        scope.$digest();
                    }
                    return $typeahead;
                }

                TypeaheadFactory.defaults = defaults;
                return TypeaheadFactory;
            }]
        })
        /**
         * typeahead的默认过滤器  通过包含过滤
         */
        .filter('kkAsyncFilter', ['$filter', function ($filter) {
            return function (array, expression, comparator) {
                return $filter('filter')(array, expression, comparator);
            };
        }])
        .directive('kkTypeahead', ['$kktypeahead', '$kkparseOptions', '$timeout', function ($kktypeahead, $kkparseOptions, $timeout) {
            var defaults = $kktypeahead.defaults;
            return {
                restrict: 'A',
                require: 'ngModel',
                link: function (scope, element, attr, controller) {
                    var options = {
                        scope: scope
                    }
                    angular.forEach(['placement', 'trigger', 'filter', 'limit', 'autoSelect', 'animation', 'minLength'], function (key) {
                        if (angular.isDefined(attr[key])) options[key] = attr[key];
                    });
                    var typeahead = $kktypeahead(element, controller, options);
                    var kkOptions = attr.kkOptions;
                    var filter = angular.isDefined(options.filter) ? options.filter : defaults.filter;
                    var limit = options.limit || defaults.limit;
                    var comparator = options.comparator || defaults.comparator;
                    if (filter) {
                        kkOptions += ' | ' + filter + ':$viewValue';
                        if (comparator) kkOptions += ':' + comparator;
                    }
                    if (limit) kkOptions += ' | limitTo:' + limit;
                    var parseOptions = $kkparseOptions(kkOptions);

                    scope.$watch(attr.ngModel, function (newValue, oldValue) {
                        var valuse = parseOptions.valuesFn(scope, controller);
                        typeahead.update(valuse);
                    });
                }
            }
        }])
        .run(['$templateCache', function ($templateCache) {
            $templateCache.put('kk/typehead.tpl.html',
                '<ul tabindex="-1" class="typeahead dropdown-menu" ng-show="$isVisible()" role="select">' +
                '<li role="presentation" ng-repeat="match in $matches" ng-class="{active: $index == $activeIndex}">' +
                '<a role="menuitem" tabindex="-1" ng-click="$select($index, $event)" ng-bind="match.label"></a>' +
                '</li>' +
                '</ul>'
            );
        }])

    /**
     * popover
     */
    angular.module('kk.util.popover', ['kk.util.tooltip'])
        .provider('$popover', function () {
            var defaults = {
                placement: 'top',
                templateUrl: 'kk/popover.tpl.html',
                trigger: 'click',
                animation: 'am-fade-y'
            }
            this.$get = ['$tooltip', '$timeout', '$document', function ($tooltip, $timeout, $document) {
                function PopoverFactory(element, controller, config) {
                    var options = angular.extend({}, defaults, config);
                    var $popover = $tooltip(element, options);
                    var scope = $popover.$scope;
                    if (options.content) {
                        $popover.$scope.content = options.content;
                    }
                    if (!options.popoverEdit) {
                        var show = $popover.show;
                        $popover.show = function () {
                            show();
                            $timeout(function () {
                                $popover.$element[0].focus();
                            })
                            safeDigest(scope);
                            $document.on('click', $popover.$onClick);
                        }
                        var hide = $popover.hide;
                        $popover.hide = function () {
                            $popover.$element.off('keydown', $popover.onKeyDown);
                            $document.off('click', $popover.$onClick);
                            hide();
                        }
                        $popover.$onClick = function (evt) {
                            if (!isChild(evt.target, $popover.$element[0]) && evt.target !== element[0]) {
                                $popover.hide();
                            }
                        }
                    }
                    if (options.popoverEdit) {
                        scope.update = function (model) {
                            scope.$$postDigest(function () {
                                scope.$model.model = model;
                            })
                        }
                        scope.submit = function () {
                            controller.$setViewValue(scope.$model);
                            controller.$render();
                            $popover.hide();
                        }
                        scope.cancel = function () {
                            scope.$model = scope.$temp;
                            scope.$temp = null;
                            $popover.hide();
                        }
                        scope.clear = function () {
                            scope.$model.model = "";
                        }
                        var show = $popover.show;
                        $popover.show = function () {
                            scope.$temp = angular.copy(scope.$model);
                            show();
                            safeDigest(scope)
                            $popover.$element.find('input')[0].focus();
                            $popover.$element.on('keydown', $popover.onKeyDown)
                        }
                        var hide = $popover.hide;
                        $popover.hide = function () {
                            $popover.$element.off('keydown', $popover.onKeyDown)
                            hide();
                        }
                        $popover.onKeyDown = function (evt) {
                            if (evt.keyCode === 13) {
                                evt.preventDefault();
                                evt.stopPropagation();
                                scope.submit();
                                return;
                            } else if (evt.keyCode === 27) {
                                evt.preventDefault();
                                evt.stopPropagation();
                                scope.cancel();
                                return;
                            }
                        }
                    }
                    return $popover;
                }

                PopoverFactory.defaults = defaults;
                return PopoverFactory;
            }]
        })
        .directive('kkPopover', ['$popover', '$sce', function ($popover, $sce) {
            return {
                restrict: 'A',
                link: function (scope, element, attr, controller) {
                    var options = {
                        scope: scope
                    }
                    angular.forEach(['html'], function (key) {
                        if (angular.isDefined(attr[key])) options[key] = attr[key];
                    })
                    scope.$watch(attr.kkPopover, function (newValue) {
                        if (angular.isObject(newValue)) {
                            if (options.html) {
                                for (var i in newValue) {
                                    newValue[i] = $sce.trustAsHtml(newValue[i]);
                                }
                            }
                            angular.extend(scope, newValue);
                        } else {
                            scope.content = newValue;
                        }
                    })
                    $popover(element, controller, options);

                }
            }
        }])
        .directive('kkPopoverEdit', ['$popover', '$sce', '$timeout', function ($popover, $sce, $timeout) {
            var defaults = {
                templateUrl: 'kk/popover.edit.tpl.html',
                trigger: 'click',
                popoverEdit: true
            }
            return {
                restrict: 'A',
                require: 'ngModel',
                scope: {
                    $model: "=ngModel"
                },
                link: function (scope, element, attr, controller) {
                    var options = {
                        scope: scope
                    }
                    angular.extend(options, defaults);
                    var popover = $popover(element, controller, options);
                    controller.$render = function () {
                        if (controller.$viewValue.model === "") {
                            element.html(" ")
                        } else {
                            element.html(controller.$viewValue.model)
                        }
                    }
                }
            }
        }])
        .run(['$templateCache', function ($templateCache) {
            $templateCache.put('kk/popover.tpl.html',
                '<div class="popover">' +
                '<div class="arrow"></div>' +
                '<h3 class="popover-title" ng-bind="title" ng-show="title"></h3>' +
                '<div class="popover-content" ng-bind="content"></div>' +
                '</div>'
            );
            $templateCache.put('kk/popover.edit.tpl.html',
                '<div class="popover">' +
                '<div class="arrow"></div>' +
                '<h3 class="popover-title" ng-bind="$model.title" ng-show="$model.title"></h3>' +
                '<div class="popover-content">' +
                '<form class="form-inline">' +
                '<div class="control-group form-group" style="white-space: nowrap">' +
                '<div class="editable-input" style="position: relative">' +
                '<input type="text" class="form-control input-sm" ng-model="$model.model"/>' +
                '<span class="editable-clear-x" ng-click="clear()"></span></div>' +
                '<div class="editable-buttons">' +
                '<button class="btn btn-primary btn-sm" ng-click="submit()"><i class="glyphicon glyphicon-ok"></i></button>' +
                '<button class="btn btn-default btn-sm editable-cancel" ng-click="cancel()"><i class="glyphicon glyphicon-remove"></i></button>' +
                '</div>' +
                '</div>' +
                '</form>' +
                '</div>' +
                '</div>'
            );
        }])

    /**
     * 模态框
     * 模态进度框
     * 模态loading :ps 这里的loading  是看了spin.js源码后得到的想法 通过纯js和css 实现，并且可以绑定一些变量实现动态更新
     */
    angular.module('kk.util.modal', [])
        .provider('$modal', function () {
            var modalId = 0;
            var defaults = {
                templateUrl: 'kk/modal.tpl.html',
                animation: 'am-fade',
                backdropAnimation: 'am-fade',
                prefixEvent: 'modal',
                backdrop: true,
                placement: "top",
                keyboard: true,
                container: false,
                show: true,
                backdropHideOnClick: true
            }
            this.$get = ['$kkCompiler', '$window', '$animate', '$timeout', function ($kkCompiler, $window, $animate, $timeout) {
                function ModalFactory(config) {
                    var $modal = {};
                    var options = angular.extend({}, defaults, config);
                    var promise = $kkCompiler.compile(options);
                    var scope = $modal.$scope = options.scope && options.scope.$new() || $rootScope.$new();
                    var compiledData;
                    var modalScope;
                    var modalElement;
                    var backdropElement = angular.element('<div class="modal-backdrop"></div>');

                    var backdropCount = 0;
                    var backdropBaseZindex = 1040;
                    var dialogBaseZindex = 1050;

                    promise.then(function (data) {
                        compiledData = data;
                    })
                    scope.$hide = function () {
                        $modal.hide();
                    }
                    scope.$submit = function () {
                        $modal.submit();
                    }
                    $modal.init = function () {
                        if (!options.id) {
                            modalId++;
                            options.id = modalId;
                        }
                        if (options.backdropAnimation) {
                            backdropElement.addClass(options.backdropAnimation);
                        }
                        if (options.show) {
                            scope.$$postDigest(function () {
                                $modal.show();
                            })
                        }
                        bindScopeEvent();
                    }
                    $modal.init();
                    $modal.show = function () {
                        if (modalElement) destroyModalElement();
                        var parent;
                        var after;
                        modalScope = scope.$new();
                        modalElement = compiledData.link(modalScope);
                        if (options.container) {
                            parent = findElement(options.container);
                            after = parent[0].lastchild;
                        } else {
                            parent = angular.element($window.document.body);
                            after = null;
                        }
                        if (angular.isDefined(options.onBeforeShow)) {
                            scope.$eval(options.onBeforeShow);
                        }
                        modalElement.css({
                            display: 'block'
                        }).addClass(options.placement);
                        if (options.animation) {
                            modalElement.addClass(options.animation);
                        }
                        if (options.zIndex) {
                            dialogBaseZindex = options.zIndex;
                            backdropBaseZindex = dialogBaseZindex - 10;
                        }
                        if (options.backdrop) {
                            modalElement.css({
                                "z-index": dialogBaseZindex + backdropCount * 20
                            })
                            backdropElement.css({
                                "z-index": backdropBaseZindex + backdropCount * 20
                            })
                            backdropCount++;
                            $animate.enter(backdropElement, parent, after).then(backdropEnterCallback);
                        }
                        $animate.enter(modalElement, parent, after).then(modalEnterCallback);
                        $timeout(function () {
                            modalElement[0].focus();
                        })
                        if (options.backdropHideOnClick) {
                            bindBackDropEvent();
                        }
                        if (options.keyboard) {
                            bindKeyBoardEvent();
                        }
                        safeDigest(modalScope);
                    }
                    $modal.hide = function () {
                        if (angular.isDefined(options.onBeforeHide)) {
                            scope.$eval(options.onBeforeHide);
                        }
                        $animate.leave(backdropElement).then(backdropLeaveCallback);
                        $animate.leave(modalElement).then(modalLeaveCallback);
                        //确保element移除  否则第二个模态框 show的时候又会显示
                        if (modalElement) modalElement.remove();
                        safeDigest(modalScope);
                    }
                    $modal.submit = function () {
                        $animate.leave(backdropElement);
                        $animate.leave(modalElement);
                        safeDigest(modalScope);
                    }
                    function bindBackDropEvent() {
                        backdropElement.on('click', function (evt) {
                            $modal.hide();
                        })
                        modalElement.on('click', function (evt) {
                            if (evt.target !== evt.currentTarget) return;
                            $modal.hide();
                        })
                    }

                    function bindScopeEvent() {
                        scope.$on(options.prefixEvent + "." + options.id + ".show", function (evt) {
                            $modal.show();
                        })
                        scope.$on(options.prefixEvent + "." + options.id + ".hide", function (evt) {
                            $modal.hide();
                        })
                    }

                    function bindKeyBoardEvent() {
                        modalElement.on("keyup", function (evt) {
                            if (evt.keyCode === 27) {
                                $modal.hide();
                            } else if (evt.keyCode === 13) {
                                $modal.submit();
                            }
                        })
                    }

                    function modalEnterCallback() {
                        if (angular.isDefined(options.onShow)) {
                            scope.$eval(options.onShow);
                        }
                    }

                    function modalLeaveCallback() {
                        if (angular.isDefined(options.onHide)) {
                            scope.$eval(options.onHide);
                        }
                    }

                    function backdropEnterCallback() {

                    }

                    function backdropLeaveCallback() {

                    }

                    function destroyModalElement() {
                        if (modalScope) {
                            modalScope.$destroy();
                            modalScope = null;
                        }
                        if (modalElement) {
                            modalElement.remove();
                            modalElement = $modal.$element = null;
                        }
                    }

                    function findElement(query, element) {
                        return angular.element((element || document).querySelectorAll(query));
                    }

                    return $modal;
                }

                return ModalFactory;
            }]
        })
        .provider('$modalLoading', function () {
            var defaults = {
                templateUrl: 'kk/modal.loading.tpl.html',
                animation: 'am-fade-y',
                backdropEvent: false
            }
            this.$get = ['$modal', function ($modal) {
                function ModalLoadingFactory(config) {
                    var options = angular.extend({}, defaults, config);
                    var $modalLoading = $modal(options);
                    return $modalLoading;
                }

                return ModalLoadingFactory;
            }]
        })
        .directive('kkModal', ['$modal', '$sce', function ($modal, $sce) {
            return {
                restrict: 'A',
                scope: true,
                link: function (scope, element, attr) {
                    var options = {
                        scope: scope,
                        show: false
                    };
                    angular.forEach(['animation', 'container', 'zIndex', 'backdrop', 'title', 'content', 'html', 'placement', 'keyboard', 'templateUrl', 'show', 'backdropHideOnClick', 'id'], function (key) {
                        if (angular.isDefined(attr[key])) options[key] = attr[key];
                    })

                    angular.forEach(['onBeforeShow', 'onShow', 'onBeforeHide', 'onHide'], function (key) {
                        var kkKey = 'kk' + key.charAt(0).toUpperCase() + key.slice(1);
                        if (angular.isDefined(attr[kkKey])) options[key] = attr[kkKey];
                    })
                    //解析false字符串或者
                    var falseRegexp = /false/;
                    angular.forEach(['backdrop', 'keyboard', 'container', 'show', 'backdropEvent'], function (key) {
                        if (angular.isDefined(attr[key]) && falseRegexp.test(attr[key])) options[key] = false;
                    })
                    var modal = $modal(options);
                    element.on('click', function () {
                        modal.show();
                    })

                    angular.forEach(['title', 'content'], function (key) {
                        if (attr[key]) {
                            attr.$observe(key, function (newValue) {
                                scope[key] = $sce.trustAsHtml(newValue);
                            })
                        }
                    })
                }
            }
        }])
        .directive('kkModalLoading', ['$modalLoading', function ($modalLoading) {
            return {
                restrict: 'AE',
                scope: true,
                link: function (scope, element, attr) {
                    var options = {
                        scope: scope,
                        show: false
                    }
                    angular.forEach(['animation', 'container', 'zIndex', 'backdrop', 'title', 'content', 'html', 'placement', 'keyboard', 'templateUrl', 'show', 'backdropHideOnClick', 'id'], function (key) {
                        if (angular.isDefined(attr[key])) options[key] = attr[key];
                    })
                    angular.forEach(['onBeforeShow', 'onShow', 'onBeforeHide', 'onHide'], function (key) {
                        var kkKey = 'kk' + key.charAt(0).toUpperCase() + key.slice(1);
                        if (angular.isDefined(attr[kkKey])) options[key] = attr[kkKey];
                    })
                    //解析false字符串或者
                    var falseRegexp = /false/;
                    angular.forEach(['backdrop', 'keyboard', 'container', 'show', 'backdropHideOnClick'], function (key) {
                        if (angular.isDefined(attr[key]) && falseRegexp.test(attr[key])) options[key] = false;
                    })
                    var modalLoading = $modalLoading(options);
                }
            }
        }])
        .run(['$templateCache', function ($templateCache) {
            $templateCache.put('kk/modal.tpl.html',
                '<div class="modal" tabindex="-1" role="dialog" aria-hidden="true">' +
                '<div class="modal-dialog">' +
                '<div class="modal-content">' +
                '<div class="modal-header" ng-show="title">' +
                '<button type="button" class="close" aria-label="Close" ng-click="$hide()">' +
                '<span aria-hidden="true">&times;</span>' +
                '</button><h4 class="modal-title" ng-bind="title"></h4></div>' +
                '<div class="modal-body" ng-bind="content"></div>' +
                '<div class="modal-footer">' +
                '<button type="button" class="btn btn-default" ng-click="$hide()">Close</button>' +
                '<button type="button" class="btn btn-default" ng-click="$submit()">Submit</button>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>'
            );
            $templateCache.put('kk/modal.loading.tpl.html',
                '<i class="fa fa-spinner fa-pulse fa-3x fa-fw" style="position: fixed;left: 50%;top: 50%;color: white"></i>'
            );

        }])


    /**
     * 这个spin是参考了spin.js效果写的  用了angular的方式
     */
    //TODO 加入横向loading
    angular.module('kk.util.spin', [])
        .directive('kkSpin', [function () {
            return {
                restrict: 'A',
                link: function (scope, element, attr) {
                    var styElement;
                    scope.$watch(attr.kkSpin, function (newValue) {
                        render(newValue);
                    }, true)
                    function render(spinOptions) {
                        destory();
                        var lines = spinOptions.lines;
                        var outer = angular.element('<div style="position: ' + spinOptions.position + ';left:' + spinOptions.left + '%;top:' + spinOptions.top + '%">');
                        element.append(outer);
                        var spinWidth = spinOptions.length * spinOptions.scale;
                        var spinHeight = spinOptions.width * spinOptions.scale;
                        var spinRadius = spinOptions.corners * spinHeight / 2;
                        for (var i = 0; i < lines; i++) {
                            var lineElement = angular.element('<div style="position:absolute;width: ' + spinWidth + 'px;height: ' + spinHeight + 'px;' +
                                'opacity:' + spinOptions.opacity + ';background: ' + spinOptions.color + ';border-radius: ' + spinRadius + 'px;animation: mymove-' + i + ' ' + spinOptions.repeatTime + 's infinite;' +
                                'transform:rotate(' + 360 / lines * i + 'deg) translate(' + spinOptions.radius * spinOptions.scale + 'px,0px);transform-origin: left center 0">');
                            outer.append(lineElement);
                        }
                        styElement = document.createElement('style');
                        styElement.type = 'text/css';
                        document.head.appendChild(styElement);
                        var sheet = styElement.sheet || styElement.styleSheet;
                        for (var i = 0; i < lines; i++) {
                            var point;
                            if (spinOptions.direction == -1) {
                                point = ((lines - i) / lines + 0.01) % 1;
                            } else {
                                point = (i / lines + 0.01) % 1;
                            }
                            var endPoint = (point + 0.6);
                            var joinPointOpacity = spinOptions.opacity;
                            if (endPoint >= 1) {
                                endPoint = endPoint % 1;
                                joinPointOpacity = 1 - ((1 - point) / 0.6) * (1 - spinOptions.opacity);
                            }
                            var rule = '@keyframes mymove-' + i + ' {' +
                                '0%{opacity: ' + joinPointOpacity + '}' +
                                point * 100 + '%{opacity: ' + spinOptions.opacity + '}' +
                                (point * 100 + 0.01) + '%{opacity:1}' +
                                (endPoint * 100) + '%{opacity:' + spinOptions.opacity + '}' +
                                '100%{opacity:' + joinPointOpacity + '}' +
                                '}';
                            sheet.insertRule(
                                rule, sheet.cssRules.length
                            )
                        }
                    }

                    function destory() {
                        element.empty();
                        if (styElement) {
                            document.head.removeChild(styElement);
                        }
                    }

                }
            }
        }])


    /**
     * slider 滑动修改参数 共用scope作用域
     */
    angular.module('kk.util.slider', [])
        .provider('$slider', function () {
            this.$get = [function () {
                function SliderFactory(element, config) {
                    var scope = config.scope;
                    var $slider = {};

                    return $slider;
                }

                return SliderFactory;
            }]
        })
        .directive('kkSlide', ['$slider', '$timeout', '$document', '$parse', function ($slider, $timeout, $document, $parse) {
            return {
                restrict: 'AE',
                templateUrl: "kk/slider.tpl.html",
                scope: true,
                link: function (scope, element, attr) {
                    var value = scope.value = scope.$eval(attr.value);
                    var maxValue = scope.$eval(attr.maxValue);
                    //精确度
                    var precesion = scope.$eval(attr.precesion);
                    var $sliderBarElement = angular.element(element[0].getElementsByClassName("kk-slider-bar")[0]);
                    var $sliderRangeElement = angular.element(element[0].getElementsByClassName("kk-slider-range")[0]);
                    var $sliderHandlerElement = angular.element(element[0].getElementsByClassName("kk-slider-handle")[0]);
                    var move = false;
                    //左边边缘离window左边的距离
                    var outerX;
                    var options = {
                        scope: scope
                    }
                    var slider = $slider(element, options);

                    $sliderHandlerElement.on("mousedown", function (evt) {
                        move = true;
                        outerX = evt.clientX - evt.currentTarget.offsetLeft;
                    })
                    $document.on('mouseup', function (evt) {
                        if (move) {
                            move = false;
                            $sliderHandlerElement.triggerHandler('mouseout');
                        }
                    })
                    $document.on('mousemove', function (evt) {
                        if (move) {
                            var sliderBarWidth = $sliderBarElement[0].offsetWidth;
                            var endOffSetX = evt.clientX - outerX;
                            if (endOffSetX <= 0) {
                                endOffSetX = 0;
                            } else if (endOffSetX > sliderBarWidth) {
                                endOffSetX = sliderBarWidth;
                            }
                            var value = (endOffSetX / sliderBarWidth * maxValue).toFixed(precesion);
                            endOffSetX = (value / (endOffSetX / sliderBarWidth * maxValue)) * endOffSetX;
                            $parse(attr.value).assign(scope.$parent, value);
                            $sliderHandlerElement.css('left', endOffSetX - 1 + "px");
                            $sliderHandlerElement.triggerHandler('mouseover');
                            safeDigest(scope.$parent);
                        }
                    })
                    scope.$slideModel = {};
                    scope.$watch(attr.value, function (newValue) {
                        value = newValue;
                        scope.$slideModel.title = newValue;
                        render();
                    })
                    scope.$watch(attr.maxValue, function (newValue) {
                        slider.maxValue = newValue;
                    })
                    attr.$observe("precesion", function (newValue) {
                        precesion = newValue;
                    })
                    function render() {
                        var barWidth = $sliderBarElement[0].offsetWidth;
                        var sliderRangeWidth = barWidth * (value / maxValue);
                        $sliderRangeElement.css("width", sliderRangeWidth + "px");
                        $sliderHandlerElement.css("left", sliderRangeWidth - 2 + "px");
                    }
                }
            }
        }])
        .run(['$templateCache', function ($templateCache) {
            $templateCache.put('kk/slider.tpl.html',
                '<span class="kk-slider">' +
                '<span class="kk-slider-range"></span>' +
                '<span class="kk-slider-bar" ></span>' +
                '<span class="kk-slider-handle" kk-tooltip data-animation="false" data-title="{{$slideModel.title}}"></span>' +
                '</span>');
        }])

    /**
     * 提示框
     */
    angular.module('kk.util.tooltip', ['kk.util.core', 'kk.util.dimensions'])
        .provider('$tooltip', function () {
            var defaults = {
                templateUrl: "kk/tooltip.tpl.html",
                animation: 'am-fade',
                prefixClass: 'tooltip',
                placement: 'top',
                trigger: 'hover focus',
                zIndex: 1040
            };
            this.$get = ['$rootScope', '$kkCompiler', '$animate', '$$rAF', '$timeout', 'dimensions', function ($rootScope, $kkCompiler, $animate, $$rAF, $timeout, dimensions) {
                function TooltipFactory(element, config) {
                    var $tooltip = {};
                    var options = $tooltip.$options = angular.extend({}, defaults, config);
                    var promise = $tooltip.$promise = $kkCompiler.compile(options);
                    var scope = $tooltip.$scope = options.scope && options.scope.$new() || $rootScope.$new;
                    // var scope=$tooltip.$scope=options.scope;
                    var compileData;
                    var tipScope;
                    var tipElement;
                    var tipContainer;
                    promise.then(function (data) {
                        compileData = data;
                        $tooltip.init();
                    })

                    $tooltip.init = function () {
                        if (angular.isElement(options.container)) {
                            tipContainer = options.container;
                        }
                        bindTriggerEvents();
                    }

                    $tooltip.show = function () {
                        if ($tooltip.$isShown) return;
                        var parent;
                        var after;
                        parent = null;
                        after = element;
                        tipScope = $tooltip.$scope.$new();
                        tipElement = $tooltip.$element = compileData.link(tipScope, function () {
                        });
                        tipElement.css({
                            top: '-9999px',
                            left: '-9999px',
                            right: 'auto',
                            display: 'block',
                            visibility: 'hidden',
                            position: 'absolute',
                            "z-index": options.zIndex,
                            "user-select": "none"
                        });
                        if (options.animation) tipElement.addClass(options.animation);
                        $tooltip.$isShown = true;
                        safeDigest(scope);
                        $animate.enter(tipElement, parent, after).then(enterAnimateCallback);
                        $tooltip.$applyPlacement();
                        tipElement.css({
                            visibility: 'visible'
                        })
                    };
                    $tooltip.$isVisible = function () {
                        return $tooltip.$isShown;
                    }
                    $tooltip.hide = function () {
                        if (!$tooltip.$isShown) return;
                        $tooltip.$isShown = false;
                        $animate.leave(tipElement).then(leaveAnimateCallback);
                        if (!options.animation) {
                            tipElement.remove();
                        }
                        safeDigest(scope);
                    }
                    $tooltip.toggle = function () {
                        if ($tooltip.$isShown) {
                            $tooltip.hide();
                        } else {
                            $tooltip.show();
                        }
                    }
                    $tooltip.$applyPlacement = function () {
                        if (!tipElement) return;
                        var placement = options.placement;
                        tipElement.addClass(options.placement);
                        var elementPosition = getPosition();
                        // console.log(elementPosition);
                        var docElement = element[0].ownerElement;
                        // elementPosition.top+=d
                        // ocElement;
                        var node = element[0];
                        var scrollTop = 0;
                        while (node.parentNode) {
                            scrollTop += node.scrollTop;
                            node = node.parentNode;
                        }
                        var tipWidth = tipElement.prop('offsetWidth');
                        var tipHeight = tipElement.prop('offsetHeight');
                        var tipPosition = getCalculatedOffset(placement, elementPosition, tipWidth, tipHeight);
                        applyPlacement(tipPosition, placement);
                    }

                    function bindTriggerEvents() {
                        var triggers = options.trigger.split(' ');
                        angular.forEach(triggers, function (trigger) {
                            if (trigger === 'click') {
                                element.on(trigger, $tooltip.toggle);
                            } else if (trigger === 'hover') {
                                element.on('mouseenter', $tooltip.show);
                                element.on('mouseleave', $tooltip.hide);
                            } else if (trigger === 'focus') {
                                element.on('focus', $tooltip.show);
                                element.on('blur', $tooltip.hide);
                            }
                        })
                    }

                    function applyPlacement(offset) {
                        tipElement.css({
                            top: offset.top + "px",
                            left: offset.left + "px"
                        });
                    }

                    function getCalculatedOffset(placement, position, actualWidth, actualHeight) {
                        var offset;
                        var placements = placement.split('-');
                        switch (placements[0]) {
                            case 'right':
                                //position:fixed
                                // offset = {
                                //     top: position.top + position.height / 2 - actualHeight / 2,
                                //     left: position.left + position.width
                                // };
                                offset = {
                                    top: element[0].offsetTop + element[0].offsetHeight / 2 - actualHeight / 2,
                                    left: element[0].offsetLeft + element[0].offsetWidth
                                }
                                break;
                            case 'left':
                                // offset = {
                                //     top: position.top + position.height / 2 - actualHeight / 2,
                                //     left: position.left - actualWidth
                                // }
                                offset = {
                                    top: element[0].offsetTop + element[0].offsetHeight / 2 - actualHeight / 2,
                                    left: element[0].offsetLeft - actualWidth
                                }
                                break;
                            case 'top':
                                // offset = {
                                //     top: position.top - actualHeight,
                                //     left: position.left + position.width / 2 - actualWidth / 2
                                // }
                                offset = {
                                    top: element[0].offsetTop - actualHeight,
                                    left: element[0].offsetLeft + element[0].offsetWidth / 2 - tipElement[0].offsetWidth / 2
                                }
                                if (placements[1]) {
                                    if (placements[1] === 'left') {
                                        // offset.left = position.left;
                                        offset.left = element[0].offsetLeft - actualWidth
                                    } else if (placements[1] === 'right') {
                                        // offset.left = position.left + position.width - actualWidth;
                                        offset.left = element[0].offsetLeft + element[0].offsetWidth
                                    }
                                }
                                break;
                            case 'bottom':
                                // offset = {
                                //     top: position.bottom,
                                //     left: position.left + position.width / 2 - actualWidth / 2
                                // };
                                offset = {
                                    top: element[0].offsetTop + element[0].offsetHeight,
                                    left: element[0].offsetLeft + element[0].offsetWidth / 2 - tipElement[0].offsetWidth / 2
                                };
                                if (placements[1]) {
                                    if (placements[1] === 'left') {
                                        // offset.left = position.left;
                                        offset.left = element[0].offsetLeft
                                    } else if (placements[1] === 'right') {
                                        // offset.left = position.left + position.width - actualWidth;
                                        offset.left = element[0].offsetLeft + element[0].offsetWidth
                                    }
                                }
                                break;
                        }
                        return offset;
                    }

                    function getPosition($element) {
                        $element = $element || (options.target || element);
                        var el = $element[0];
                        var isBody = el.tagName === 'BODY';
                        var elRect = el.getBoundingClientRect();
                        var rect = {};
                        for (var p in elRect) {
                            rect[p] = elRect[p];
                        }
                        // var elOffset = isBody ? {
                        //     top: 0,
                        //     left: 0
                        // } : dimensions.offset(el);
                        return angular.extend({}, rect);
                    }

                    function safeDigest(scope) {
                        scope.$$phase || scope.$root && scope.$root.$$phase || scope.$digest();
                    }

                    function enterAnimateCallback() {
                        if (angular.isDefined(options.onShow) && angular.isFunction(options.onShow)) {
                            options.onShow($tooltip);
                        }
                    }

                    function leaveAnimateCallback() {

                    }

                    return $tooltip;
                }

                return TooltipFactory;
            }]
        })
        .directive('kkTooltip', ['$tooltip', '$http', '$sce', '$$rAF', function ($tooltip, $http, $sce, $$rAF) {
            return {
                restrict: 'A',
                scope: true,
                link: function (scope, element, attrs, transclusion) {
                    var tooltip;
                    var options = {
                        scope: scope
                    };
                    angular.forEach(['trigger', 'templateUrl', 'placement', 'animation'], function (key) {
                        if (angular.isDefined(attrs[key])) {
                            options[key] = attrs[key];
                        }
                    })
                    var falseRegexp = /false/;
                    angular.forEach(['animation'], function (key) {
                        if (angular.isDefined(attrs[key]) && falseRegexp.test(attrs[key])) options[key] = false;
                    })
                    attrs.$observe('title', function (newValue) {
                        if (angular.isDefined(newValue)) {
                            var oldValue = scope.title;
                            scope.title = $sce.trustAsHtml(newValue);
                            if (angular.isDefined(oldValue)) {
                                $$rAF(function () {
                                    if (tooltip) tooltip.$applyPlacement();
                                })
                            }

                        }
                    })
                    tooltip = $tooltip(element, options);
                    scope.$on('$destory', function () {
                        if (tooltip) tooltip.destory();
                        options = null;
                        tooltip = null;
                    })
                }
            }
        }])
        .run(['$templateCache', function ($templateCache) {
            $templateCache.put('kk/tooltip.tpl.html',
                '<div class="tooltip in" ng-show="title">' +
                '<div class="tooltip-arrow"></div>' +
                '<div class="tooltip-inner" ng-bind="title" style="white-space: nowrap">' +
                '</div>' +
                '</div>');
        }])


    /**
     * 用正则表达式匹配 A for B in C
     */
    angular.module('kk.util.parseOptions', [])
        .provider('$kkparseOptions', function () {
            var defaults = {
                regexp: /(.*?)\s+(?:as(.*?)\s+)?for\s+(.*?)\s+in\s+(.*?)$/
            }
            this.$get = ['$parse', function ($parse) {
                function ParseOptionsFactory(attr) {
                    var $parseOptions = {};
                    var match;
                    var valueName;
                    var valuesName;
                    var displayFn;
                    var valuesFn;
                    var valueFn;

                    $parseOptions.init = function () {
                        $parseOptions.$match = match = attr.match(defaults.regexp);
                        displayFn = $parse(match[2] || match[1]);
                        valueName = match[3];
                        valuesFn = $parse(match[4]);
                        $parseOptions.valuesName = match[4];
                        valueFn = $parse(match[2] ? match[1] : valueName);
                    }
                    /**
                     * 获取 C
                     */
                    $parseOptions.valuesFn = function (scope, controller) {

                        var arr = valuesFn(scope, controller).map(function (match, index) {
                            var locals = {};
                            var label;
                            var value;
                            locals[valueName] = match;
                            label = displayFn(scope, locals);
                            value = valueFn(scope, locals);
                            return {
                                label: label,
                                value: value,
                                index: index
                            }
                        });
                        return arr;
                    }
                    $parseOptions.displayValue = function (modelValue) {
                        var scope = {};
                        scope[valueName] = modelValue;
                        return displayFn(scope);
                    };
                    $parseOptions.init();
                    return $parseOptions;
                }

                return ParseOptionsFactory;
            }]
        })

    /**
     * 根据 templateUrl用$compile方法编译 对应的模板
     * 因为是通过$http获取 所以返回一个promise
     */
    angular.module('kk.util.core', [])
        .service('$kkCompiler', ['$q', '$http', '$injector', '$compile', '$controller', '$templateCache', function ($q, $http, $injector, $compile, $controller, $templateCache) {
            this.compile = function (options) {
                var templateUrl = options.templateUrl;
                var transformTemplate = options.transformTemplate || angular.identity;
                var resolve = options.resolve || {};
                resolve.$template = fetchTemplate(templateUrl);
                return $q.all(resolve).then(function (locals) {
                    // var template=transformTemplate(locals.$template);
                    var template = locals.$template;
                    if (options.html) {
                        template = template.replace(/ng-bind="/gi, 'ng-bind-html="');
                    }
                    var element = angular.element('<div>').html(template.trim()).contents();
                    var linkFn = $compile(element);
                    return {
                        locals: locals,
                        element: element,
                        link: function (scope) {
                            return linkFn.apply(null, arguments);
                        }
                    }
                });
            }

            //缓存模板  第二次拿就直接从缓存中拿 不通过http请求
            var templatePromises = {};

            function fetchTemplate(templateUrl) {
                return templatePromises[templateUrl] ||
                    (templatePromises[templateUrl] = $http.get(templateUrl, {
                        cache: $templateCache
                    }).then(function (res) {
                        return res.data;
                    }))
            }
        }]);

    /**
     * 尺寸 目前用的不多  用于防止dom  现在采用fixed定位  计算left  top后根据不同 placement 放在对应的位置
     */
    angular.module('kk.util.dimensions', [])
        .factory('dimensions', function () {
            var fn = {};
            fn.offset = function (element) {
                var boxRect = element.getBoundingClientRect();
                var docElement = element.ownerDocument;
                return {
                    width: boxRect.width || element.offsetWidth,
                    height: boxRect.height || element.offsetHeight,
                    top: boxRect.top + (window.pageYOffset || docElement.documentElement.scrollTop) - (docElement.documentElement.clientTop || 0),
                    left: boxRect.left + (window.pageXOffset || docElement.documentElement.scrollLeft) - (docElement.documentElement.clientLeft || 0)
                };
            };
            fn.css = function (element, prop, extra) {
                var value;
                if (element.currentStyle) {
                    value = element.currentStyle[prop];
                } else if (window.getComputedStyle) {
                    value = window.getComputedStyle(element)[prop];
                } else {
                    value = element.style[prop];
                }
                return extra === true ? parseFloat(value) || 0 : value;
            };
            fn.setOffset = function (element, options, i) {
                var curPosition;
                var curLeft;
                var curCSSTop;
                var curTop;
                var curOffset;
                var curCSSLeft;
                var calculatePosition;
                var position = fn.css(element, 'position');
                var curElem = angular.element(element);
                var props = {};
                if (position === 'static') {
                    element.style.position = 'relative';
                }
                curOffset = fn.offset(element);
                curCSSTop = fn.css(element, 'top');
                curCSSLeft = fn.css(element, 'left');
                calculatePosition = (position === 'absolute' || position === 'fixed') && (curCSSTop + curCSSLeft).indexOf('auto') > -1;
                if (calculatePosition) {
                    curPosition = fn.position(element);
                    curTop = curPosition.top;
                    curLeft = curPosition.left;
                } else {
                    curTop = parseFloat(curCSSTop) || 0;
                    curLeft = parseFloat(curCSSLeft) || 0;
                }
                if (angular.isFunction(options)) {
                    options = options.call(element, i, curOffset);
                }
                if (options.top !== null) {
                    props.top = options.top - curOffset.top + curTop;
                }
                if (options.left !== null) {
                    props.left = options.left - curOffset.left + curLeft;
                }
                if ('using' in options) {
                    options.using.call(curElem, props);
                } else {
                    curElem.css({
                        top: props.top + 'px',
                        left: props.left + 'px'
                    });
                }
            }
            return fn;
        });

    /**
     * 分页
     */
    angular.module("kk.util.pagination", [])
        .provider("$pagination", [function () {
            this.$get = function () {
                function paginationFactory() {
                    var $pagination = {};
                    return $pagination;
                }

                return paginationFactory;
            }
        }])
        .directive("kkPagination", ['$http', '$templateCache', '$compile', '$parse', function ($http, $templateCache, $compile, $parse) {
            var FIRST_ITEM = 0,
                PREV_ITEM = 1,
                DIGIT_ITEM = 2,//数字
                DOT_ITEM = 3,//点
                NEXT_ITEM = 4,
                LAST_ITEM = 5;
            var defaults = {
                series: 5
            }
            return {
                restrict: "EA",
                require: 'ngModel',
                scope: true,
                templateUrl: "kk/pagination.tpl.html",
                link: function (scope, element, attr, controller) {
                    var pageCount = scope.$eval(attr.totalItems);
                    var pageNumber = 1;
                    var series = scope.$eval(attr.series) || defaults.series;
                    scope.$watch(attr.ngModel, function (newVal, oldVal) {
                        pageNumber = newVal;
                        refresh();
                    });
                    scope.onPaginationClick = function (item) {
                        if (item.class && item.class.indexOf("disabled") != -1) {
                            return;
                        }
                        if (item.type === DIGIT_ITEM) {
                            controller.$setViewValue(item.value);
                        } else if (item.type === FIRST_ITEM) {
                            controller.$setViewValue(1);
                        } else if (item.type === PREV_ITEM) {
                            controller.$setViewValue(pageNumber - 1);
                        } else if (item.type === NEXT_ITEM) {
                            controller.$setViewValue(pageNumber + 1);
                        } else if (item.type === LAST_ITEM) {
                            controller.$setViewValue(pageCount);
                        }
                        refresh();
                    }

                    function Item(value, type) {
                        this.value = value;
                        this.type = type;
                        this.class;
                    }

                    function refresh() {
                        scope.items = [];
                        //"首页","上一页"
                        var current = null;
                        var first = new Item("首页", FIRST_ITEM);
                        scope.items.push(first);
                        var prev = new Item("上一页", PREV_ITEM);
                        scope.items.push(prev);
                        if (pageNumber <= series) {
                            if (pageCount <= series + 1) {
                                //1 ~ pageCount
                                for (var i = 1; i <= pageCount; i++) {
                                    var item = new Item(i, DIGIT_ITEM);
                                    scope.items.push(item);
                                    if (pageNumber == i) {
                                        item.class = "active";
                                        current = item;
                                    }
                                }
                            } else {
                                //1 ~ series
                                //...
                                //pageCount
                                for (var i = 1; i <= series; i++) {
                                    var item = new Item(i, DIGIT_ITEM);
                                    scope.items.push(item);
                                    if (pageNumber == i) {
                                        item.class = "active";
                                        current = item;
                                    }
                                }
                                scope.items.push(new Item("...", DOT_ITEM));
                                scope.items.push(new Item(pageCount, DIGIT_ITEM));
                            }
                        } else if (pageNumber > series) {
                            scope.items.push(new Item(1, DIGIT_ITEM));
                            var start = Math.floor((pageNumber - 1) / series) * series;
                            if (pageCount > start + series + 1) {
                                //...
                                //start+1  ~ start +5
                                //...
                                //pageCount
                                scope.items.push(new Item("...", DOT_ITEM));
                                for (var i = start + 1; i <= start + series; i++) {
                                    var item = new Item(i, DIGIT_ITEM);
                                    if (pageNumber == i) {
                                        item.class = "active";
                                        current = item;
                                    }
                                    scope.items.push(item);
                                }
                                scope.items.push(new Item("...", DOT_ITEM));
                                scope.items.push(new Item(pageCount, DIGIT_ITEM));
                            } else {
                                //...
                                //start +1 ~ pageCount
                                scope.items.push(new Item("...", DOT_ITEM));
                                for (var i = start + 1; i <= pageCount; i++) {
                                    var item = new Item(i, DIGIT_ITEM);
                                    if (pageNumber == i) {
                                        item.class = "active";
                                        current = item;
                                    }
                                    scope.items.push(item);
                                }
                            }
                        }
                        //"下一页","尾页"
                        var next = new Item("下一页", NEXT_ITEM);
                        scope.items.push(next);
                        var last = new Item("尾页", LAST_ITEM);
                        scope.items.push(last);
                        if (current.value == 1) {
                            if (prev.class === undefined) {
                                prev.class = "";
                            }
                            prev.class += " disabled";
                            if (first.class === undefined) {
                                first.class = "";
                            }
                            first.class += " disabled";
                        }
                        if (current.value == pageCount) {
                            if (next.class === undefined) {
                                next.class = "";
                            }
                            next.class += " disabled";
                            if (last.class === undefined) {
                                last.class = "";
                            }
                            last.class += " disabled";
                        }
                    }
                }
            }
        }])
        .run(['$templateCache', function ($templateCache) {
            $templateCache.put('kk/pagination.tpl.html',
                '<div class="pagination">' +
                '<ul class="pagination">' +
                '<li ng-class="item.class" ng-repeat="item in items"><a href="" ng-click="onPaginationClick(item)">{{item.value}}</a>' +
                '</li>' +
                '</ul>' +
                '</div>');
        }]);

    //图片压缩
    angular.module("kk.util.uploader", [])
        .service("$imageCompress", function () {
            this.compress = function (source, quality, outType) {
                var sourceImage = new Image();
                sourceImage.src = source;
                var mime_type = "image/jpeg";
                if (outType != undefined && outType == "image/png") {
                    mime_type = "image/png";
                }
                var cvs = document.createElement("canvas");
                cvs.width = sourceImage.naturalWidth;
                cvs.height = sourceImage.naturalHeight;

                var ctx = cvs.getContext("2d").drawImage(sourceImage, 0, 0);
                var newImageData = cvs.toDataURL(mime_type, quality / 100);
                return newImageData;
            }
        })
        .directive("kkImageUpload", ['$parse', '$imageCompress', function ($parse, $imageCompress) {
            var defaults = {
                quality: 50
            }
            return {
                restrict: 'EA',
                template: '<form>' +
                '<input type="file" style="opacity: 0;width: 100%;height: 100%;position:absolute;display: inline-block;top:0;left:0;">' +
                '</form>' +
                '<div ng-transclude></div>'
                ,
                transclude: true,
                scope: false,
                link: function (scope, element, attr) {
                    var cropOptions = scope.$eval(attr.kkImageUpload);
                    element.prop("style", "position:relative");
                    var formElement = element.find('form');
                    var inputElement = element.find('input');

                    scope.$watch(attr.kkImageUpload, function (newValue) {
                        render();
                    }, true)
                    inputElement.on('change', function (evt) {
                        var files = inputElement[0].files;
                        if (files[0].type && files[0].type.split('/').indexOf("image") !== -1) {
                            var reader = new FileReader();
                            reader.readAsDataURL(files[0]);

                            reader.onload = function (evt) {
                                cropOptions.file = evt.target.result;
                                render();
                                formElement[0].reset();
                            }
                        } else {
                            cropOptions.onError(files[0].type);
                            formElement[0].reset();
                        }
                    });

                    function render() {
                        if (cropOptions.file) {
                            cropOptions.compressed = $imageCompress.compress(cropOptions.file, cropOptions.quality || defaults.quality);
                            cropOptions.size = cropOptions.file.length;
                            cropOptions.compressedSize = cropOptions.compressed.length;
                            safeDigest(scope);
                        }
                    }
                }
            }
        }])
        .service('$imageCrop', ['$q','$timeout',function ($q,$timeout) {
            var cvs = document.createElement("canvas");
            var timer;
            var delay=30;
            this.crop = function (sourceImage, offsetLeft, offsetTop, cropWidth, cropHeight, containerWidth, containerHeight) {
                var deferred=$q.defer();
                var mime_type = "image/jpeg";
                var dx=sourceImage.naturalWidth/containerWidth;
                var dy=sourceImage.naturalHeight/containerHeight;
                cvs.width = containerWidth;
                cvs.height = containerHeight;
                // console.log(dx)
                // cvs.getContext("2d").drawImage(image,offsetLeft,offsetTop,cropWidth,cropHeight,0,0,image.naturalWidth,image.naturalHeight);
                cvs.getContext("2d").drawImage(sourceImage, offsetLeft*dx, offsetTop*dy, cropWidth*dx, cropHeight*dy, 0, 0, containerWidth, containerHeight);
                // if(timer){
                //     $timeout.cancel(timer);
                // }
                // $timeout(function () {
                var croppedImageData = cvs.toDataURL(mime_type, 0.5);
                deferred.resolve(croppedImageData);
                // },delay);
                return deferred.promise;
            }
        }])
        //图片裁剪
        .directive('kkImageCrop', ['$document', '$imageCrop','$timeout', function ($document, $imageCrop,$timeout) {
            return {
                restrict: 'EA',
                templateUrl: 'kk/imageCrop.tpl.html',
                link: function (scope, element, attr) {
                    var imageUpload = scope.$eval(attr.kkImageCrop);
                    //设置最小延迟  减少加载次数 消除由于频繁对图片进行裁剪造成的页面卡顿问题
                    var timer;
                    var count=0;
                    var cropWidth = 200;
                    var cropHeight = 200;
                    scope.cropFile = null;
                    element.css("position", "relative");
                    var cropElement = (angular.element('<div class="crop-box" style="position: absolute;top:20px;left:20px;width: ' + cropWidth + 'px;height: ' + cropHeight + 'px;" draggable="false"> ' +
                        '<span class="crop-line-x"></span><span class="crop-line-y"></span></div>'))
                    element.append(cropElement);
                    var move = false;
                    var startX;
                    var startY;
                    var endX=20;
                    var endY=20;
                    var offsetX = cropElement[0].offsetLeft;
                    var offsetY = cropElement[0].offsetTop;
                    var fileOption;
                    var cropSourceImage=new Image();
                    function cropPic() {
                        var containerWidth = element[0].offsetWidth;
                        var containerHeight = element[0].offsetHeight;
                        var promise = $imageCrop.crop(cropSourceImage, endX, endY, cropWidth, cropHeight, containerWidth, containerHeight);
                        promise.then(function (data) {
                            fileOption.cropped = data;
                            safeDigest(scope);
                        })
                    }
                    //监听文件变化 如果文件发生变化 进行裁剪
                    scope.$watch(attr.kkImageCrop, function (newVal, oldVal) {
                        if(newVal.file){
                            scope.cropFile = newVal.file;
                            cropSourceImage.src=newVal.file;
                            fileOption=newVal;
                            cropPic();
                        }
                    }, true);

                    //监听鼠标点击事件  开始移动裁剪框
                    cropElement.on('mousedown', function (evt) {
                        move = true;
                        startX = evt.clientX;
                        startY = evt.clientY;
                        offsetX = cropElement[0].offsetLeft;
                        offsetY = cropElement[0].offsetTop;
                    })
                    cropElement.on('mousemove', function (evt) {
                        if (move) {
                            var dx = evt.clientX - startX;
                            var dy = evt.clientY - startY;
                            endX = offsetX + dx;
                            endY = offsetY + dy;
                            if (endX < 0) {
                                endX = 0;
                            }
                            else if (endX + cropElement[0].clientWidth > element[0].clientWidth) {
                                endX = element[0].clientWidth - cropElement[0].clientWidth;
                            }
                            if (endY < 0) {
                                endY = 0;
                            }
                            else if (endY + cropElement[0].clientHeight > element[0].clientHeight) {
                                endY = element[0].clientHeight - cropElement[0].clientHeight;
                            }
                            cropElement.css({
                                top: endY + "px",
                                left: endX + "px"
                            })
                            //对图片进行裁剪
                            // count++;
                            // if(count==100){
                            //     count=0;
                            cropPic();
                            // }
                            // if(timer){
                            //     $timeout.cancel(timer);
                            // }
                            // timer=$timeout(function () {
                            //     cropPic(fileOption);
                            // },delay);
                        }
                    })
                    $document.on('mouseup', function (evt) {
                        if(move){
                            move = false;
                        }
                    })
                }
            }
        }])
        .run(['$templateCache', function ($templateCache) {
            $templateCache.put('kk/imageCrop.tpl.html',
                '<img ng-src="{{cropFile}}" style="width: 100%;user-select:none;" draggable="false" ondragstart="return false;">');
        }]);

    //表格 数据 搜索功能
    //select 加入分行hr功能 还可以有小箭头
    //进度条
    //流程图  进度图

    //github上面的日期频率图
    //图片懒加载
    //时间轴

    function safeDigest(scope) {
        scope.$$phase || scope.$root && scope.$root.$$phase || scope.$digest();
    }

    function findElement(query, container) {

    }

    function isChild(node, container) {
        var node = node;
        do {
            if (node === container) {
                return true;
            }
            node = node.parentNode;
        } while (node);
        return false;
    }

})(window, document)


