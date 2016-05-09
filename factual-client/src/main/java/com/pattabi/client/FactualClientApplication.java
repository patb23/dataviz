package com.pattabi.client;

import com.factual.driver.Factual;
import com.factual.driver.Query;
import org.apache.commons.lang3.StringUtils;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.apache.commons.io.FileUtils;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@SpringBootApplication
public class FactualClientApplication {

  public static void main(String[] args) {
    SpringApplication.run(FactualClientApplication.class, args);

    List<String> texts =
      Stream.of("American", "Bagels", "Bakeries", "Barbecues", "Bars",
        "Burgers", "Chinese", "Coffee",
        "Delis", "Fast Food", "French", "Indian", "Italian",
        "Japanese", "Korean", "Mexican", "Night Clubs", "Pizza", "Seafood",
        "Sports Bars", "Steakhouses", "Vegan and Vegetarian").collect(Collectors.toList());

    String fileName = "factual_all";
    File f = new File(fileName + ".txt");
    Factual factual = new Factual("3OhvCyaIdWrbzwiDDklugY6fFeEO9K0kY5xlo958", "btRdmsg1rv2eVFGandefvA0gMRSpLq6y2iYE80GU");

    String resp = "";
    for (String string : texts) {
      Query q = new Query();
      q.and(
        q.field("locality").equal("New York")
        , q.field("category_labels").includes(string)
//      ,q.field("category_ids").equal(347)
      );
      for (int i = 0; i < 10; i++) {
        File f1 = new File(StringUtils.substringBefore(string, " ") + i + ".txt");
        try {
          int offset = i * 50;
          String aResponse = factual.fetch("restaurants-us", q.limit(50).offset(offset)).getJson();
          resp = StringUtils.join(resp, aResponse);
          resp = StringUtils.remove(resp, "{\"version\":3,\"status\":\"ok\",\"response\":{\"data\":");
          resp = resp.replaceAll("],\"included_rows\":([0-9]+)}}", "");

          FileUtils.writeStringToFile(f1, aResponse, "UTF-8");
          Thread.sleep(2000);
        } catch (Exception e) {
          e.printStackTrace();
        }
        System.out.println(resp);

      }
      try {
        FileUtils.writeStringToFile(f, resp, "UTF-8");
      } catch (IOException e) {
        e.printStackTrace();
      }

    }


  }
}
