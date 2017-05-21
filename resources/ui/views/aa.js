(function () {
    'use strict';
    angular.module("kk.util",['ngAnimate'])
        .provider('$tab',function () {
            var defaults={
                template:'kk.util.tab',
                activeClass:'active',
                hideClass:'hide'
            }
            var controller=function ($scope) {
                var self=this;
                self.$options=$scope.$options=angular.copy(defaults);
                $scope.$panes=this.$panes=[];
                this.$activePaneChangeListeners=[];

                this.$push=function (pane) {
                    this.$panes.push(pane);
                }
                this.$setActive=function (value) {
                    $scope.$panes.$active=value;
                }
                self.$isActive=$scope.$isActive=function ($pane,$index) {
                    return $scope.$panes.$active===$pane.name || $scope.$panes.$active === $index;
                }
                $scope.$setActive=function (value) {
                    self.$panes.$active=value;
                    self.$activePaneChangeListeners.forEach(function (fn) {
                        fn();
                    })
                }
            }
            this.$get=function () {
                var $tab={};
                $tab.controller=controller;
                $tab.defaults=defaults;
                return $tab;
            }
        })
        .directive('tabset',function ($tab,$parse) {
            return{
                restrice:'EA',
                require:['tabset'],
                transclude:true,
                scope:true,
                controller:['$scope',$tab.controller],
                templateUrl:function () {
                    return $tab.defaults.template;
                },
                link:function (scope,element,attrs,controllers) {
                    var $tabsController=controllers[0];
                    if(attrs.kkActiveTab){
                        var parsedKkActiveTab = $parse(attrs.kkActiveTab);
                        $tabsController.$activePaneChangeListeners.push(function () {
                            parsedKkActiveTab.assign(scope,$tabsController.$panes.$active);
                        })
                        scope.$watch(attrs.kkActiveTab,function (newVal,oldVal) {
                            $tabsController.$setActive(newVal);
                        },true)
                    }
                }
            }
        })
        .directive('tab',['$sce','$animate',function ($sce,$animate) {
            return {
                restrict:'A',
                require:['^tabset'],
                link:function (scope,element,attrs,controllers) {
                    var $tabsController=controllers[0];
                    attrs.$observe('title',function (newVal,oldVal) {
                        scope.title=$sce.trustAsHtml(newVal);
                    })
                    scope.name=attrs.name;
                    $tabsController.$push(scope);
                    function render() {
                        var index=$tabsController.$panes.indexOf(scope);
                        // $animate[$tabsController.$isActive(scope,index) ? 'addClass':'removeClass'](element,$tabsController.$options.activeClass);
                        if($tabsController.$isActive(scope,index)){
                            $animate['addClass'](element,$tabsController.$options.activeClass);
                            $animate['removeClass'](element,$tabsController.$options.hideClass);
                        }else{
                            $animate['addClass'](element,$tabsController.$options.hideClass);
                            $animate['removeClass'](element,$tabsController.$options.activeClass);
                        }
                    }
                    $tabsController.$activePaneChangeListeners.push(function () {
                        render();
                    })
                    render();
                }
            }
        }])
    angular.module("kk.util")
        .run(['$templateCache',function ($templateCache) {
            $templateCache.put('kk.util.tab',
                '<div class="nav nav-tabs">' +
                '<li ng-repeat="$pane in $panes"  ng-class="[$isActive($pane,$index) ? $options.activeClass:\'\']">' +
                '<a href="" ng-bind-html="$pane.title" ng-click="$setActive($pane.name||$index)"></a>'+
                '</li>'+
                '</div>'+
                '<div ng-transclude class="tab-content"></div>'
            )
        }])
})()
