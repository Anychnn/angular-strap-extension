(function () {
    "use strict";
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
        .directive("pagination", ['$http', '$templateCache', '$compile', function ($http, $templateCache, $compile) {
            var FIRST_ITEM = 0,
                PREV_ITEM = 1,
                DIGIT_ITEM = 2,//数字
                DOT_ITEM = 3,//点
                NEXT_ITEM = 4,
                LAST_ITEM = 5;
            var series = 5;
            return {
                restrict: "E",
                scope: true,
                link: function (scope, element, attr) {

                    var pagerStr = attr.pager;
                    var pageCount = 1;
                    var pageNumber = 1;


                    scope.$watch(pagerStr, function (newVal, oldVal) {

                        pageCount = newVal.pageCount ? newVal.pageCount : 1;
                        pageNumber = newVal.pageNumber;
                        refresh();
                    })

                    scope.onPaginationClick = function (item) {
                        if (item.class && item.class.indexOf("disabled") != -1) {
                            return;
                        }
                        if (item.type === DIGIT_ITEM) {
                            scope.$eval(pagerStr).pageNumber = item.value;
                        } else if (item.type === FIRST_ITEM) {
                            scope.$eval(pagerStr).pageNumber = 1;
                        } else if (item.type === PREV_ITEM) {
                            scope.$eval(pagerStr).pageNumber = pageNumber - 1;
                        } else if (item.type === NEXT_ITEM) {
                            scope.$eval(pagerStr).pageNumber = pageNumber + 1;
                        } else if (item.type === LAST_ITEM) {
                            scope.$eval(pagerStr).pageNumber = pageCount;
                        }
                        scope.refresh();
                    }


                    var template = $templateCache.get("kk.pagination");
                    angular.element(template);
                    var pagination = $compile(template.trim())(scope);
                    element.append(pagination);

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
                                for (var i = start + 1; i <= start + 5; i++) {
                                    var item = new Item(i, DIGIT_ITEM);
                                    if (pageNumber == i) {
                                        item.class = "active";
                                        current = item;
                                    }
                                    scope.items.push(new Item(i, DIGIT_ITEM));
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
        .run(['$templateCache', '$http', function ($templateCache, $http) {
            $http.get("resources/project/tpls/directive/pagination.html")
                .then(function (data) {
                    $templateCache.put("kk.pagination", data.data.trim());
                })
        }])



    angular.module('kk.util.filesupload',['kk.util.imageCompress'])
        //多个文件上传
        .directive('kkFilesUpload', function ($parse,$imageCompress,$q,fileReader) {
            var defaults = {
                fileFilters: '|jpg|png|jpeg|bmp|gif|'
            };

            return {
                restrict: 'A',
                scope: false,
                link: function (scope, element, attrs, controller) {
                    var model = $parse(attrs.kkFilesUpload);
                    var options = angular.copy(defaults);
                    if (angular.isDefined(attrs.fileFilters)) {
                        options.fileFilters = attrs.fileFilters;
                    }
                    if (angular.isDefined(attrs.onFileSelected)) {
                        options.onFileSelected = attrs.onFileSelected;
                    }
                    var modelSetter = model.assign;
                    element.bind('change', function (evt) {
                        log("change")
                        var files = scope.$eval(attrs.kkFilesUpload) || [];
                        var promises=[];
                        angular.forEach(element[0].files, function (file) {
                            if (filter(file, options.fileFilters) && files.indexOf(file) === -1) {
                                if(attrs.kkCompress){
                                    promises.push(fileReader.readAsDataURL(file));
                                }else{
                                    files.push(file);
                                }
                                //console.log($imageCompress.compress(file,30));
                            }
                        });
                        if(attrs.kkCompress){
                            $q.all(promises)
                                .then(function(datas){
                                    var files=scope.$eval(attrs.kkFilesUpload);
                                    //files.splice(0,files.length);
                                    angular.forEach(datas,function(data){
                                        var img=new Image();
                                        img.src=data;
                                        console.log("before compress length")
                                        console.log(data.length/2014)
                                        var compressedImage=$imageCompress.compress(img,30);
                                        console.log("compressedLength")
                                        console.log(compressedImage.src.length/1024)
                                        files.push(compressedImage.src);
                                    })
                                    if (attrs.onFileSelected) {
                                        scope.$eval(attrs.onFileSelected);
                                    }
                                    //modelSetter(scope, res);
                                });
                        }else{
                            console.log(files);
                            modelSetter(scope, files);
                            if (attrs.onFileSelected) {
                                scope.$eval(attrs.onFileSelected);
                            }
                            scope.$apply(function () {});
                        }
                    })
                }
            }
            function filter(file, fileFilters) {
                var type = '|' + file.type.slice(file.type.lastIndexOf('/') + 1) + '|';
                return fileFilters.indexOf(type) !== -1;
            }
        })
        .factory('fileReader',['$q',function($q){
            var onLoad=function(reader,deferred){
                return function (){
                    var img=new Image();
                    img.src=reader.result;
                    deferred.resolve(reader.result);
                }
            }
            var onError=function(reader,deferred){
                return function (){
                    deferred.reject(reader.result);
                }
            }

            var getReader=function(deferred){
                var reader=new FileReader();
                reader.onload=onLoad(reader,deferred);
                reader.onerror=onError(reader,deferred);
                return reader;
            }

            var readAsDataURL=function(file,compressPercent){
                var deferred=$q.defer();
                var reader=getReader(deferred);
                reader.readAsDataURL(file);
                return deferred.promise;
            }
            return {
                readAsDataURL:readAsDataURL
            }
        }])

    angular.module('kk.util.imageCompress',[])
        .service("$imageCompress", function () {
            this.compress = function (source, quality, outType) {

                var mime_type = "image/jpeg";
                if (outType != undefined && outType == "image/png") {
                    mime_type = "image/png";
                }
                var cvs = document.createElement("canvas");
                cvs.width = source.naturalWidth;
                cvs.height = source.naturalHeight;

                var ctx = cvs.getContext("2d").drawImage(source, 0, 0);
                var newImageData = cvs.toDataURL(mime_type, quality / 100);
                var result_image = new Image();
                result_image.src = newImageData;
                return result_image;
            }
        })

})()
