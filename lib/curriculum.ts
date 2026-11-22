export const curriculumSource = "https://cbseacademic.nic.in/web_material/CurriculumMain27/SecPart1/Maths_SecP1X_2026-27.pdf";
export const curriculumConcepts = [
  {
    "id": "factor",
    "name": "Factorisation",
    "unit": "Algebra",
    "page": 4,
    "prerequisites": [],
    "lesson": "Taking out ax gives ax² − akx = ax(x − k). Expanding must reconstruct both terms.",
    "source": "CBSE Class X Maths 2026–27 · p. 4",
    "supported": true,
    "coverage": "AI-generated text questions and teaching. Calculation checks where applicable; proofs are AI-reviewed. Unseen diagrams and unverified questions are not supported."
  },
  {
    "id": "product",
    "name": "Zero-product rule",
    "unit": "Algebra",
    "page": 4,
    "prerequisites": [
      "factor"
    ],
    "lesson": "Over real numbers, a product is zero when at least one factor is zero. Consider every factor.",
    "source": "CBSE Class X Maths 2026–27 · p. 4",
    "supported": true,
    "coverage": "AI-generated text questions and teaching. Calculation checks where applicable; proofs are AI-reviewed. Unseen diagrams and unverified questions are not supported."
  },
  {
    "id": "division",
    "name": "Valid division",
    "unit": "Algebra",
    "page": 4,
    "prerequisites": [
      "product"
    ],
    "lesson": "Dividing by x assumes x is nonzero. Test the zero case separately in the original equation.",
    "source": "CBSE Class X Maths 2026–27 · p. 4",
    "supported": true,
    "coverage": "AI-generated text questions and teaching. Calculation checks where applicable; proofs are AI-reviewed. Unseen diagrams and unverified questions are not supported."
  },
  {
    "id": "complete",
    "name": "Complete solution sets",
    "unit": "Algebra",
    "page": 4,
    "prerequisites": [
      "product",
      "division"
    ],
    "lesson": "Substitution verifies a candidate, not completeness. Factorisation with all factors considered establishes completeness.",
    "source": "CBSE Class X Maths 2026–27 · p. 4",
    "supported": true,
    "coverage": "AI-generated text questions and teaching. Calculation checks where applicable; proofs are AI-reviewed. Unseen diagrams and unverified questions are not supported."
  },
  {
    "id": "prime-factorisation",
    "name": "Prime factorisation and unique decomposition",
    "unit": "Number systems",
    "page": 3,
    "prerequisites": [],
    "lesson": "A positive integer greater than one has a unique prime factorisation, apart from the order of factors.",
    "source": "CBSE Class X Maths 2026–27 · p. 3",
    "supported": true,
    "coverage": "AI-generated text questions and teaching. Calculation checks where applicable; proofs are AI-reviewed. Unseen diagrams and unverified questions are not supported."
  },
  {
    "id": "hcf-lcm",
    "name": "HCF and LCM from prime factors",
    "unit": "Number systems",
    "page": 3,
    "prerequisites": [
      "prime-factorisation"
    ],
    "lesson": "HCF uses the minimum exponent of each shared prime; LCM uses the maximum. For two positive integers HCF × LCM equals their product.",
    "source": "CBSE Class X Maths 2026–27 · p. 3",
    "supported": true,
    "coverage": "AI-generated text questions and teaching. Calculation checks where applicable; proofs are AI-reviewed. Unseen diagrams and unverified questions are not supported."
  },
  {
    "id": "irrationality",
    "name": "Irrationality proofs",
    "unit": "Number systems",
    "page": 3,
    "prerequisites": [
      "prime-factorisation"
    ],
    "lesson": "Proofs for square roots such as √2, √3 and √5 use contradiction and prime-factor parity; rational multiples and sums need justified extensions.",
    "source": "CBSE Class X Maths 2026–27 · p. 3",
    "supported": true,
    "coverage": "AI-generated text questions and teaching. Calculation checks where applicable; proofs are AI-reviewed. Unseen diagrams and unverified questions are not supported."
  },
  {
    "id": "polynomial-zero",
    "name": "Zeros by substitution",
    "unit": "Algebra",
    "page": 3,
    "prerequisites": [
      "factor"
    ],
    "lesson": "A number r is a zero of p when p(r)=0. Substitution must include all signed terms.",
    "source": "CBSE Class X Maths 2026–27 · p. 3",
    "supported": true,
    "coverage": "AI-generated text questions and teaching. Calculation checks where applicable; proofs are AI-reviewed. Unseen diagrams and unverified questions are not supported."
  },
  {
    "id": "polynomial-graphs",
    "name": "Zeros as graph intersections",
    "unit": "Algebra",
    "page": 3,
    "prerequisites": [
      "polynomial-zero"
    ],
    "lesson": "Real zeros correspond to points where the polynomial graph meets the x-axis.",
    "source": "CBSE Class X Maths 2026–27 · p. 3",
    "supported": true,
    "coverage": "AI-generated text questions and teaching. Calculation checks where applicable; proofs are AI-reviewed. Unseen diagrams and unverified questions are not supported."
  },
  {
    "id": "coefficients",
    "name": "Quadratic zeros and coefficients",
    "unit": "Algebra",
    "page": 3,
    "prerequisites": [
      "polynomial-zero"
    ],
    "lesson": "For ax²+bx+c, a≠0, the sum of the two zeros is −b/a and their product is c/a. Expanding a(x−r)(x−s) establishes these relations.",
    "source": "CBSE Class X Maths 2026–27 · p. 3",
    "supported": true,
    "coverage": "AI-generated text questions and teaching. Calculation checks where applicable; proofs are AI-reviewed. Unseen diagrams and unverified questions are not supported."
  },
  {
    "id": "linear-graphs",
    "name": "Linear pairs and graphical solutions",
    "unit": "Algebra",
    "page": 4,
    "prerequisites": [],
    "lesson": "An intersection satisfies both equations; distinct parallel lines have no common solution and coincident lines have infinitely many.",
    "source": "CBSE Class X Maths 2026–27 · p. 4",
    "supported": true,
    "coverage": "AI-generated text questions and teaching. Calculation checks where applicable; proofs are AI-reviewed. Unseen diagrams and unverified questions are not supported."
  },
  {
    "id": "linear-consistency",
    "name": "Consistency and number of solutions",
    "unit": "Algebra",
    "page": 4,
    "prerequisites": [
      "linear-graphs"
    ],
    "lesson": "For Ax+By=C and Dx+Ey=F, AE−BD≠0 gives a unique solution. Proportional coefficients require comparing constants to distinguish coincident from parallel lines.",
    "source": "CBSE Class X Maths 2026–27 · p. 4",
    "supported": true,
    "coverage": "AI-generated text questions and teaching. Calculation checks where applicable; proofs are AI-reviewed. Unseen diagrams and unverified questions are not supported."
  },
  {
    "id": "linear-substitution",
    "name": "Solving pairs by substitution",
    "unit": "Algebra",
    "page": 4,
    "prerequisites": [
      "linear-consistency"
    ],
    "lesson": "Express one variable from an equation, substitute into the other, then check the pair in both original equations.",
    "source": "CBSE Class X Maths 2026–27 · p. 4",
    "supported": true,
    "coverage": "AI-generated text questions and teaching. Calculation checks where applicable; proofs are AI-reviewed. Unseen diagrams and unverified questions are not supported."
  },
  {
    "id": "linear-elimination",
    "name": "Solving pairs by elimination",
    "unit": "Algebra",
    "page": 4,
    "prerequisites": [
      "linear-consistency"
    ],
    "lesson": "Multiply equations consistently to align coefficients, subtract or add to remove a variable, and check both equations.",
    "source": "CBSE Class X Maths 2026–27 · p. 4",
    "supported": true,
    "coverage": "AI-generated text questions and teaching. Calculation checks where applicable; proofs are AI-reviewed. Unseen diagrams and unverified questions are not supported."
  },
  {
    "id": "linear-modelling",
    "name": "Situational linear-equation models",
    "unit": "Algebra",
    "page": 4,
    "prerequisites": [
      "linear-substitution",
      "linear-elimination"
    ],
    "lesson": "Define variables and units, form two constraints from the situation and check the solution against the context.",
    "source": "CBSE Class X Maths 2026–27 · p. 4",
    "supported": true,
    "coverage": "AI-generated text questions and teaching. Calculation checks where applicable; proofs are AI-reviewed. Unseen diagrams and unverified questions are not supported."
  },
  {
    "id": "quadratic-standard",
    "name": "Quadratic standard form",
    "unit": "Algebra",
    "page": 4,
    "prerequisites": [],
    "lesson": "A quadratic equation has form ax²+bx+c=0 with a≠0; move all terms to one side before identifying coefficients.",
    "source": "CBSE Class X Maths 2026–27 · p. 4",
    "supported": true,
    "coverage": "AI-generated text questions and teaching. Calculation checks where applicable; proofs are AI-reviewed. Unseen diagrams and unverified questions are not supported."
  },
  {
    "id": "quadratic-roots",
    "name": "Quadratic roots by factorisation",
    "unit": "Algebra",
    "page": 4,
    "prerequisites": [
      "quadratic-standard",
      "product",
      "coefficients"
    ],
    "lesson": "If ax²+bx+c=a(x−r)(x−s), either factor can vanish. Substitution checks the resulting real roots.",
    "source": "CBSE Class X Maths 2026–27 · p. 4",
    "supported": true,
    "coverage": "AI-generated text questions and teaching. Calculation checks where applicable; proofs are AI-reviewed. Unseen diagrams and unverified questions are not supported."
  },
  {
    "id": "quadratic-formula",
    "name": "Quadratic formula",
    "unit": "Algebra",
    "page": 4,
    "prerequisites": [
      "quadratic-standard"
    ],
    "lesson": "For a≠0, the real roots are (−b±√(b²−4ac))/(2a) when the discriminant is nonnegative.",
    "source": "CBSE Class X Maths 2026–27 · p. 4",
    "supported": true,
    "coverage": "AI-generated text questions and teaching. Calculation checks where applicable; proofs are AI-reviewed. Unseen diagrams and unverified questions are not supported."
  },
  {
    "id": "discriminant",
    "name": "Discriminant and nature of roots",
    "unit": "Algebra",
    "page": 4,
    "prerequisites": [
      "quadratic-standard"
    ],
    "lesson": "D=b²−4ac determines the real-root count: positive means two distinct roots, zero a repeated root and negative no real roots.",
    "source": "CBSE Class X Maths 2026–27 · p. 4",
    "supported": true,
    "coverage": "AI-generated text questions and teaching. Calculation checks where applicable; proofs are AI-reviewed. Unseen diagrams and unverified questions are not supported."
  },
  {
    "id": "quadratic-modelling",
    "name": "Situational quadratic models",
    "unit": "Algebra",
    "page": 4,
    "prerequisites": [
      "quadratic-roots",
      "quadratic-formula"
    ],
    "lesson": "Translate a contextual constraint into a quadratic, solve it and reject roots that violate the original situation.",
    "source": "CBSE Class X Maths 2026–27 · p. 4",
    "supported": true,
    "coverage": "AI-generated text questions and teaching. Calculation checks where applicable; proofs are AI-reviewed. Unseen diagrams and unverified questions are not supported."
  },
  {
    "id": "ap-pattern",
    "name": "Arithmetic sequences and common difference",
    "unit": "Algebra",
    "page": 4,
    "prerequisites": [],
    "lesson": "An arithmetic progression has a constant difference between successive terms.",
    "source": "CBSE Class X Maths 2026–27 · p. 4",
    "supported": true,
    "coverage": "AI-generated text questions and teaching. Calculation checks where applicable; proofs are AI-reviewed. Unseen diagrams and unverified questions are not supported."
  },
  {
    "id": "ap-nth",
    "name": "Deriving and using the nth term",
    "unit": "Algebra",
    "page": 4,
    "prerequisites": [
      "ap-pattern"
    ],
    "lesson": "The nth term is a+(n−1)d because there are n−1 equal steps from the first term.",
    "source": "CBSE Class X Maths 2026–27 · p. 4",
    "supported": true,
    "coverage": "AI-generated text questions and teaching. Calculation checks where applicable; proofs are AI-reviewed. Unseen diagrams and unverified questions are not supported."
  },
  {
    "id": "ap-sum",
    "name": "Deriving and using the AP sum",
    "unit": "Algebra",
    "page": 4,
    "prerequisites": [
      "ap-nth"
    ],
    "lesson": "Pairing opposite terms gives S=n(first+last)/2, equivalently n[2a+(n−1)d]/2.",
    "source": "CBSE Class X Maths 2026–27 · p. 4",
    "supported": true,
    "coverage": "AI-generated text questions and teaching. Calculation checks where applicable; proofs are AI-reviewed. Unseen diagrams and unverified questions are not supported."
  },
  {
    "id": "ap-modelling",
    "name": "AP applications in daily life",
    "unit": "Algebra",
    "page": 4,
    "prerequisites": [
      "ap-nth",
      "ap-sum"
    ],
    "lesson": "Identify the first term, common difference and term count from the context before applying an AP formula.",
    "source": "CBSE Class X Maths 2026–27 · p. 4",
    "supported": true,
    "coverage": "AI-generated text questions and teaching. Calculation checks where applicable; proofs are AI-reviewed. Unseen diagrams and unverified questions are not supported."
  },
  {
    "id": "coordinates",
    "name": "Coordinates and ordered pairs",
    "unit": "Coordinate geometry",
    "page": 5,
    "prerequisites": [],
    "lesson": "Coordinates specify horizontal and vertical displacement from the origin; reversing the order changes the point.",
    "source": "CBSE Class X Maths 2026–27 · p. 5",
    "supported": true,
    "coverage": "AI-generated text questions and teaching. Calculation checks where applicable; proofs are AI-reviewed. Unseen diagrams and unverified questions are not supported."
  },
  {
    "id": "distance",
    "name": "Distance formula",
    "unit": "Coordinate geometry",
    "page": 5,
    "prerequisites": [
      "coordinates"
    ],
    "lesson": "The distance is √[(x₂−x₁)²+(y₂−y₁)²], obtained from a right triangle. Squaring makes the signs of differences irrelevant.",
    "source": "CBSE Class X Maths 2026–27 · p. 5",
    "supported": true,
    "coverage": "AI-generated text questions and teaching. Calculation checks where applicable; proofs are AI-reviewed. Unseen diagrams and unverified questions are not supported."
  },
  {
    "id": "section",
    "name": "Internal section formula",
    "unit": "Coordinate geometry",
    "page": 5,
    "prerequisites": [
      "coordinates"
    ],
    "lesson": "For AP:PB=m:n, P=((nx₁+mx₂)/(m+n),(ny₁+my₂)/(m+n)). The endpoint weights are opposite to the adjacent segment ratio.",
    "source": "CBSE Class X Maths 2026–27 · p. 5",
    "supported": true,
    "coverage": "AI-generated text questions and teaching. Calculation checks where applicable; proofs are AI-reviewed. Unseen diagrams and unverified questions are not supported."
  },
  {
    "id": "similarity-def",
    "name": "Similar figures: examples and counterexamples",
    "unit": "Geometry",
    "page": 5,
    "prerequisites": [],
    "lesson": "Similar figures have equal corresponding angles and proportional corresponding lengths; equal size is not required.",
    "source": "CBSE Class X Maths 2026–27 · p. 5",
    "supported": true,
    "coverage": "AI-generated text questions and teaching. Calculation checks where applicable; proofs are AI-reviewed. Unseen diagrams and unverified questions are not supported."
  },
  {
    "id": "bpt",
    "name": "Basic proportionality theorem and proof",
    "unit": "Geometry",
    "page": 5,
    "prerequisites": [
      "similarity-def"
    ],
    "lesson": "A line parallel to one triangle side cuts the other two sides proportionally; a valid proof must justify the construction and proportions.",
    "source": "CBSE Class X Maths 2026–27 · p. 5",
    "supported": true,
    "coverage": "AI-generated text questions and teaching. Calculation checks where applicable; proofs are AI-reviewed. Unseen diagrams and unverified questions are not supported."
  },
  {
    "id": "bpt-converse",
    "name": "Converse of proportionality theorem",
    "unit": "Geometry",
    "page": 5,
    "prerequisites": [
      "bpt"
    ],
    "lesson": "If a line cuts two sides of a triangle in the same ratio, it is parallel to the third side.",
    "source": "CBSE Class X Maths 2026–27 · p. 5",
    "supported": true,
    "coverage": "AI-generated text questions and teaching. Calculation checks where applicable; proofs are AI-reviewed. Unseen diagrams and unverified questions are not supported."
  },
  {
    "id": "similarity-criteria",
    "name": "AAA, SSS and SAS similarity criteria",
    "unit": "Geometry",
    "page": 5,
    "prerequisites": [
      "similarity-def"
    ],
    "lesson": "Use corresponding angles, all three side ratios, or an included equal angle with its two adjacent side ratios to establish similarity.",
    "source": "CBSE Class X Maths 2026–27 · p. 5",
    "supported": true,
    "coverage": "AI-generated text questions and teaching. Calculation checks where applicable; proofs are AI-reviewed. Unseen diagrams and unverified questions are not supported."
  },
  {
    "id": "similarity-lengths",
    "name": "Corresponding lengths in similar triangles",
    "unit": "Geometry",
    "page": 5,
    "prerequisites": [
      "similarity-criteria"
    ],
    "lesson": "After similarity and correspondence are given, each corresponding side has the same scale factor.",
    "source": "CBSE Class X Maths 2026–27 · p. 5",
    "supported": true,
    "coverage": "AI-generated text questions and teaching. Calculation checks where applicable; proofs are AI-reviewed. Unseen diagrams and unverified questions are not supported."
  },
  {
    "id": "tangent-radius",
    "name": "Tangent-radius theorem and proof",
    "unit": "Geometry",
    "page": 6,
    "prerequisites": [],
    "lesson": "A tangent is perpendicular to the radius at the point of contact; the proof must establish that contact and perpendicularity.",
    "source": "CBSE Class X Maths 2026–27 · p. 6",
    "supported": true,
    "coverage": "AI-generated text questions and teaching. Calculation checks where applicable; proofs are AI-reviewed. Unseen diagrams and unverified questions are not supported."
  },
  {
    "id": "tangent-equal",
    "name": "Equal tangents theorem and proof",
    "unit": "Geometry",
    "page": 6,
    "prerequisites": [
      "tangent-radius"
    ],
    "lesson": "Two tangent segments from one external point to the same circle have equal lengths.",
    "source": "CBSE Class X Maths 2026–27 · p. 6",
    "supported": true,
    "coverage": "AI-generated text questions and teaching. Calculation checks where applicable; proofs are AI-reviewed. Unseen diagrams and unverified questions are not supported."
  },
  {
    "id": "tangent-length",
    "name": "Numerical applications of equal tangents",
    "unit": "Geometry",
    "page": 6,
    "prerequisites": [
      "tangent-equal"
    ],
    "lesson": "For tangents PA and PB from the same external point P to one circle, PA=PB; the external point condition is essential.",
    "source": "CBSE Class X Maths 2026–27 · p. 6",
    "supported": true,
    "coverage": "AI-generated text questions and teaching. Calculation checks where applicable; proofs are AI-reviewed. Unseen diagrams and unverified questions are not supported."
  },
  {
    "id": "trig-ratios",
    "name": "Right-triangle trigonometric ratios",
    "unit": "Trigonometry",
    "page": 6,
    "prerequisites": [
      "similarity-def"
    ],
    "lesson": "For a specified acute angle, sine is opposite/hypotenuse, cosine adjacent/hypotenuse and tangent opposite/adjacent; reciprocal ratios reverse these fractions.",
    "source": "CBSE Class X Maths 2026–27 · p. 6",
    "supported": true,
    "coverage": "AI-generated text questions and teaching. Calculation checks where applicable; proofs are AI-reviewed. Unseen diagrams and unverified questions are not supported."
  },
  {
    "id": "trig-existence",
    "name": "Why trigonometric ratios are well defined",
    "unit": "Trigonometry",
    "page": 6,
    "prerequisites": [
      "similarity-criteria",
      "trig-ratios"
    ],
    "lesson": "Similarity makes ratios independent of the size of the right triangle for a fixed acute angle.",
    "source": "CBSE Class X Maths 2026–27 · p. 6",
    "supported": true,
    "coverage": "AI-generated text questions and teaching. Calculation checks where applicable; proofs are AI-reviewed. Unseen diagrams and unverified questions are not supported."
  },
  {
    "id": "trig-standard",
    "name": "Standard angles and undefined ratios",
    "unit": "Trigonometry",
    "page": 6,
    "prerequisites": [
      "trig-ratios"
    ],
    "lesson": "Standard-angle values follow from special right triangles and endpoint limits. A zero denominator makes a ratio undefined.",
    "source": "CBSE Class X Maths 2026–27 · p. 6",
    "supported": true,
    "coverage": "AI-generated text questions and teaching. Calculation checks where applicable; proofs are AI-reviewed. Unseen diagrams and unverified questions are not supported."
  },
  {
    "id": "trig-relations",
    "name": "Relations and reciprocal ratios",
    "unit": "Trigonometry",
    "page": 6,
    "prerequisites": [
      "trig-ratios"
    ],
    "lesson": "Where denominators are nonzero, tan A=sin A/cos A, cot A=cos A/sin A, sec A=1/cos A and cosec A=1/sin A.",
    "source": "CBSE Class X Maths 2026–27 · p. 6",
    "supported": true,
    "coverage": "AI-generated text questions and teaching. Calculation checks where applicable; proofs are AI-reviewed. Unseen diagrams and unverified questions are not supported."
  },
  {
    "id": "trig-identity",
    "name": "Pythagorean identity applications",
    "unit": "Trigonometry",
    "page": 6,
    "prerequisites": [
      "trig-ratios"
    ],
    "lesson": "For acute A, sin²A+cos²A=1 and both ratios are positive. Derive the missing positive ratio using the identity.",
    "source": "CBSE Class X Maths 2026–27 · p. 6",
    "supported": true,
    "coverage": "AI-generated text questions and teaching. Calculation checks where applicable; proofs are AI-reviewed. Unseen diagrams and unverified questions are not supported."
  },
  {
    "id": "trig-proofs",
    "name": "Proofs of simple identities",
    "unit": "Trigonometry",
    "page": 6,
    "prerequisites": [
      "trig-identity",
      "trig-relations"
    ],
    "lesson": "Transform one side using valid identities and preserve denominator restrictions throughout.",
    "source": "CBSE Class X Maths 2026–27 · p. 6",
    "supported": true,
    "coverage": "AI-generated text questions and teaching. Calculation checks where applicable; proofs are AI-reviewed. Unseen diagrams and unverified questions are not supported."
  },
  {
    "id": "heights-distances",
    "name": "Heights, distances, elevation and depression",
    "unit": "Trigonometry",
    "page": 6,
    "prerequisites": [
      "trig-standard",
      "trig-ratios"
    ],
    "lesson": "Model the horizontal and vertical distances using at most two right triangles with 30°, 45° or 60° angles; account for observer height.",
    "source": "CBSE Class X Maths 2026–27 · p. 6",
    "supported": true,
    "coverage": "AI-generated text questions and teaching. Calculation checks where applicable; proofs are AI-reviewed. Unseen diagrams and unverified questions are not supported."
  },
  {
    "id": "sector",
    "name": "Sector area and arc length",
    "unit": "Mensuration",
    "page": 7,
    "prerequisites": [
      "trig-standard"
    ],
    "lesson": "A central angle θ occupies θ/360 of a circle. Multiply that fraction by πr² for area or 2πr for arc length.",
    "source": "CBSE Class X Maths 2026–27 · p. 7",
    "supported": true,
    "coverage": "AI-generated text questions and teaching. Calculation checks where applicable; proofs are AI-reviewed. Unseen diagrams and unverified questions are not supported."
  },
  {
    "id": "segment",
    "name": "Segment area and boundary length",
    "unit": "Mensuration",
    "page": 7,
    "prerequisites": [
      "sector",
      "trig-ratios"
    ],
    "lesson": "A minor segment area is sector area minus the enclosed triangle area. Distinguish its chord from its arc; syllabus angles are 60°, 90°, 120°.",
    "source": "CBSE Class X Maths 2026–27 · p. 7",
    "supported": true,
    "coverage": "AI-generated text questions and teaching. Calculation checks where applicable; proofs are AI-reviewed. Unseen diagrams and unverified questions are not supported."
  },
  {
    "id": "solid-formulas",
    "name": "Surface and volume formulas of basic solids",
    "unit": "Mensuration",
    "page": 7,
    "prerequisites": [],
    "lesson": "Choose the formula for a cube, cuboid, sphere, hemisphere, right circular cylinder or cone and distinguish length, area and volume units.",
    "source": "CBSE Class X Maths 2026–27 · p. 7",
    "supported": true,
    "coverage": "AI-generated text questions and teaching. Calculation checks where applicable; proofs are AI-reviewed. Unseen diagrams and unverified questions are not supported."
  },
  {
    "id": "composite-volume",
    "name": "Volumes of combined solids",
    "unit": "Mensuration",
    "page": 7,
    "prerequisites": [
      "solid-formulas"
    ],
    "lesson": "For non-overlapping solid parts joined along a face, add their volumes; shared boundary faces have no volume.",
    "source": "CBSE Class X Maths 2026–27 · p. 7",
    "supported": true,
    "coverage": "AI-generated text questions and teaching. Calculation checks where applicable; proofs are AI-reviewed. Unseen diagrams and unverified questions are not supported."
  },
  {
    "id": "composite-surface",
    "name": "Exposed areas of combined solids",
    "unit": "Mensuration",
    "page": 7,
    "prerequisites": [
      "solid-formulas"
    ],
    "lesson": "Add exposed surfaces only: joined faces are internal and must not count toward external area.",
    "source": "CBSE Class X Maths 2026–27 · p. 7",
    "supported": true,
    "coverage": "AI-generated text questions and teaching. Calculation checks where applicable; proofs are AI-reviewed. Unseen diagrams and unverified questions are not supported."
  },
  {
    "id": "grouped-data",
    "name": "Grouped frequencies and class intervals",
    "unit": "Statistics and probability",
    "page": 7,
    "prerequisites": [],
    "lesson": "Grouped data records frequencies within intervals. Use class midpoints for estimated means and cumulative frequencies to locate the median class.",
    "source": "CBSE Class X Maths 2026–27 · p. 7",
    "supported": true,
    "coverage": "AI-generated text questions and teaching. Calculation checks where applicable; proofs are AI-reviewed. Unseen diagrams and unverified questions are not supported."
  },
  {
    "id": "grouped-mean",
    "name": "Grouped mean: direct, assumed and step methods",
    "unit": "Statistics and probability",
    "page": 7,
    "prerequisites": [
      "grouped-data"
    ],
    "lesson": "The grouped mean estimate is Σ(fm)/Σf, where m is the class midpoint. Assumed-mean and step-deviation methods are algebraic rearrangements.",
    "source": "CBSE Class X Maths 2026–27 · p. 7",
    "supported": true,
    "coverage": "AI-generated text questions and teaching. Calculation checks where applicable; proofs are AI-reviewed. Unseen diagrams and unverified questions are not supported."
  },
  {
    "id": "grouped-median",
    "name": "Grouped median",
    "unit": "Statistics and probability",
    "page": 7,
    "prerequisites": [
      "grouped-data"
    ],
    "lesson": "Locate the class containing N/2 using cumulative frequencies, then interpolate with the lower boundary, class width and median-class frequency.",
    "source": "CBSE Class X Maths 2026–27 · p. 7",
    "supported": true,
    "coverage": "AI-generated text questions and teaching. Calculation checks where applicable; proofs are AI-reviewed. Unseen diagrams and unverified questions are not supported."
  },
  {
    "id": "grouped-mode",
    "name": "Grouped mode",
    "unit": "Statistics and probability",
    "page": 7,
    "prerequisites": [
      "grouped-data"
    ],
    "lesson": "Use the unique modal class and its neighbouring frequencies in the grouped-mode formula; avoid bimodal cases.",
    "source": "CBSE Class X Maths 2026–27 · p. 7",
    "supported": true,
    "coverage": "AI-generated text questions and teaching. Calculation checks where applicable; proofs are AI-reviewed. Unseen diagrams and unverified questions are not supported."
  },
  {
    "id": "probability",
    "name": "Classical probability of simple events",
    "unit": "Statistics and probability",
    "page": 7,
    "prerequisites": [],
    "lesson": "For a finite equally likely sample space, probability is favourable outcomes divided by all outcomes. Count each distinct outcome once.",
    "source": "CBSE Class X Maths 2026–27 · p. 7",
    "supported": true,
    "coverage": "AI-generated text questions and teaching. Calculation checks where applicable; proofs are AI-reviewed. Unseen diagrams and unverified questions are not supported."
  }
];
export const supportedConcepts=curriculumConcepts.filter(c=>c.supported);
export const diagnosticCount=supportedConcepts.length;
export const syllabus={id:"cbse-class10-maths-2026-27",title:"CBSE Class 10 Mathematics · 2026–27",sourceUrl:curriculumSource,scope:"Full seven-unit concept map for Mathematics Standard (041). GPT-6 Luna generates text questions and teaching from official CBSE syllabus, sample-paper and marking-scheme context. Each question needs solution review and applicable calculation checks. Proofs are AI-reviewed, not formally verified; unseen-diagram questions are unsupported. Mastery is an estimate from observed answers, not a board-score guarantee. Prerequisite links are Alfred’s teaching sequence.",concepts:curriculumConcepts};
