'use strict';
// var main=angular.module('blog',['util','ui.router','mgcrea.ngStrap','ngAnimate']);
var main=angular.module('blog',['mgcrea.ngStrap','ngAnimate','ui.router']);
main.config(function ($stateProvider,$urlRouterProvider) {
    $urlRouterProvider.when("", "/main");
    $stateProvider
        .state("main", {
            url: "/main",
            templateUrl: "resources/ui/views/main.html"
        })
        .state('demo',{
            url:'/demo',
            templateUrl:"resources/ui/views/demo.html"
        })
        .state('article',{
            url:'/article',
            templateUrl:"resources/ui/views/article.html"
        })
        .state('profile',{
            url:'/profile',
            templateUrl:"resources/ui/views/profile.html"
        })
})
main.controller('mainCtrl',function ($scope,$location) {
    $scope.$location = $location;

    $scope.navPage={
        title:"安洋Blog",
        router:'main'
    };
    $scope.$watch(function () {
        return $scope.$location;
    },function (newVal,oldVal) {
    })

    $scope.hide=function () {
        angular.element("#id1").siblings(".id2").remove();
    }

    $scope.pages=[
        {
            title:'Demo',
            router:'demo'
        },
        {
            title:'文章',
            router:'article'
        },
        {
            title:'简历',
            router:'profile'
        }
    ]
})
// main.controller('NavbarDemoCtrl', function($scope, $location) {
//     // $scope.$location = $location;
//
// });


angular.module('util',[])
    .provider('log',function () {
        this.$get=function () {
            return function (str) {
                try{
                    console.log(JSON.stringify(str))
                }catch (e){
                    console.log(str)
                }
            }
        }
    })


function log(str) {
    try{
        console.log(JSON.stringify(str))
    }catch (e){
        console.log(str)
    }
}