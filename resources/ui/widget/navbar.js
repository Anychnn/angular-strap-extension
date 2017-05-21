angular.module('ui.navbar',['ui.router'])
    .provider('$navbar',function () {
        var defaults={
            activeClass:'active',
            routeAttr:'data-match-route',
            strict:false
        }
        this.$get=function () {
            return {
                defaults:defaults
            }
        }
    })
    .directive('navBar',['$location','$navbar',function ($location,$navbar) {
            var defaults=$navbar.defaults;
            return {
                restrict:'A',
                link:function (scope,element,attr,controller) {
                    var options=angular.copy(defaults);
                    angular.forEach(Object.keys(defaults),function (key) {
                        if(angular.isDefined(attr[key])){
                            options[key]=attr[key];
                        }
                    })
                }
            }

    }])