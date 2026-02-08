import sys

if __name__ == "__main__":
    input_file = sys.argv[1]
    output_file = "./Zp-NCBI-New.fasta"

    with open(input_file, "r") as f:
        with open(output_file, "w") as o:
            for line in f:
                if line.startswith(">"):
                    o.write(line.replace("_", " "))
                else:
                    o.write(line.upper())
    