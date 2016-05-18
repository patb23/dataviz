/**
 * Created by shruthi on 5/15/16.
 */
import groovy.json.*
import static groovy.json.JsonParserType.LAX as RELAX

class JsonUtil {

  static void main(String[] args) {

    File f = new File('src/main/resources/nyc_restaurants.json');
    File out = new File('src/main/resources/out.json');


    f.readLines().each { line ->

      def json = new JsonSlurper().parseText(line)

      //println json

      def builder = new JsonBuilder(json);
      builder.content.category_labels = json.category_labels.flatten();

      def removables = ["Social", "Food and Dining", "Restaurants"]

      builder.content.category_labels.retainAll{  !removables.contains(it) }


     // println result

     // builder.content.category_labels = result
      if (builder.content.cuisine == null) {
        println builder.content
      } else {
        out.append(JsonOutput.toJson(builder.content).toString() + "," + System.getProperty("line.separator"))
      }

    }

  }
}
