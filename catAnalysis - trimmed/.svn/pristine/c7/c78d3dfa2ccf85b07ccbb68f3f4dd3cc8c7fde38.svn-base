/**
 * Created by pmeenaks on 7/28/2015.
 */
require('es6-promise').polyfill();
var _ = require('lodash'),
    should = require('should'),
    request = require('supertest'),
    app = require('../../server'),
    agent = request.agent(app)


    denodeify = require('denodeify')
var readFile = denodeify(require('fs').readFile);

assert = require('assert'),
    express = require('express'),
    chai = require('chai'),
    chaiHttp = require('chai-http')

expect = require('chai').expect;


chai.use(chaiHttp);

var common = require('./common');



describe('solrClient', function () {
    describe('query', function (args) {

        it('solr client call should be made ', function (done) {
            agent.get('/cat/facet').end(function (err, res) {

                var anArray=[];
                var facets = new Map();

                var array = res.body;
                array.forEach(function(item, index, array){
                    //console.log(item);
                    anArray = item.concat(anArray);
                })

                console.log('done adding');

                anArray.forEach(function(item, index, array){

                    var anElem = facets.get(item.fieldName) ||[];
                    anElem.push({'key':item.key, 'value':item.value});
//                    console.log(anElem);
                    facets.set(item.fieldName, anElem);

                });


                console.log(facets.get('reportDate'));
                done();
            });
        });
    })

    describe('promiseTest', function(args){
        it('denodifying the file reader', function(done){

            readFile('./data/ActiveFirePerimeters.kml').then(function(text){
                console.log(text);
                done();
            });

            console.log('AFter reading ....')
        });

    });
    describe('address search', function (args) {
        it('should return a list of matching address ', function (done) {
            agent.get('/cat/listAddress?addrStr=Crandon').end(function (req, res) {

                //console.log('called address list '+ res.body);
                done();
            });

        });

    });


    describe('mapService', function (args) {

        it('should return kml for active fires ', function (done) {

            agent.get('/cat/activeFire').end(function (err, res) {
                if(err) console.log('failed to get kml ')
                console.log(res);
                done();
            });

        });
        it('should return kml from cache ', function (done) {

            agent.get('/cat/activeFire').end(function (err, res) {

                done();
            });

        });

    });

    describe('policy retrieval', function (args) {
        it('get the policy detail', function (done) {
            agent.get('/cat/policy?latLong=39.6978,-123.399767').end(function (err, result) {
                done();
            });
        })
    })
/*
    describe('geocodeService', function (args) {

        it('should get session from proxix', function (done) {

            agent.get('/proxix/session').end(function (err, res) {
                console.log('called proxix ' + res.body);
                done();
            })
        });
        it('should get session from cache', function (done) {

            agent.get('/proxix/session').end(function (err, res) {
                console.log('called cache ' + res.body);
                done();
            })
        });

    });
*/

})
;
